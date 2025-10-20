import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../app.module'
import { PrismaService } from '../prisma.service'
import { SEARCH_ENGINE, SearchEngine } from '../modules/search/interfaces/search.interface'
import type { IndexedGame } from '../modules/search/interfaces/index.interface'
import { formatDoc } from '../modules/search/helpers/format-doc'
import { GameData } from '../modules/game/interfaces/game.interface'
import { Logger } from '@nestjs/common'

async function buildIndexedGameBatch(prisma: PrismaService, skip: number, take: number) {
  const games = await prisma.game.findMany({
    skip,
    take,
    orderBy: [{ id: 'asc' }],
    select: {
      id: true,
      title_jp: true,
      title_zh: true,
      title_en: true,
      aliases: true,
      intro_jp: true,
      intro_zh: true,
      intro_en: true,
      tags: true,
      platform: true,
      nsfw: true,
      release_date: true,
      staffs: true,
      covers: { select: { id: true, sexual: true, violence: true, url: true, dims: true } },
      images: { select: { id: true, sexual: true, violence: true, url: true, dims: true } },
      developers: {
        select: {
          role: true,
          developer: { select: { id: true, name: true, aliases: true } },
        },
      },
      characters: {
        select: {
          character: {
            select: {
              name_jp: true,
              name_en: true,
              name_zh: true,
              aliases: true,
              intro_jp: true,
              intro_en: true,
              intro_zh: true,
            },
          },
        },
      },
    },
  })

  const docs: IndexedGame[] = games.map(g => formatDoc(g as unknown as GameData))

  return docs
}

async function main() {
  const logger = new Logger('reindex-all')
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  })
  const prisma = app.get(PrismaService)
  const searchEngine = app.get<SearchEngine>(SEARCH_ENGINE)

  const total = await prisma.game.count()
  const batchSize = 500
  let processed = 0
  for (let skip = 0; skip < total; skip += batchSize) {
    const docs = await buildIndexedGameBatch(prisma, skip, batchSize)
    if (docs.length) {
      await searchEngine.bulkUpsertGames(docs)
    }
    processed += docs.length

    logger.log(`Indexed ${processed}/${total}`)
  }
  logger.log(`Reindex completed, indexed ${total} games`)
  await app.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
