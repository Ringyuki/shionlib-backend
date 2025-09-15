import { Injectable } from '@nestjs/common'
import { GameDataFetcherService } from './game-data-fetcher.service'
import { PrismaService } from '../../../prisma.service'
import { GameCharacter, GameCover, GameDeveloper } from '../interfaces/game.interface'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class GameService {
  constructor(
    private readonly gameDataFetcherService: GameDataFetcherService,
    private readonly prisma: PrismaService,
  ) {}

  async createFromBangumiAndVNDB(
    b_id: string,
    v_id: string | undefined,
    creator_id: number,
  ): Promise<number> {
    const existing = await this.prisma.game.findFirst({
      where: {
        OR: [{ b_id }, { v_id }],
      },
    })
    if (existing) {
      throw new ShionBizException(ShionBizCode.GAME_ALREADY_EXISTS)
    }

    const { finalGameData, finalCharactersData, finalProducersData, finalCoversData } =
      await this.gameDataFetcherService.fetchData(b_id, v_id)

    const gameId = await this.prisma.$transaction(async tx => {
      const gameCreateData: any = {
        b_id: finalGameData.b_id,
        v_id: finalGameData.v_id,
        title_jp: this.dataOrEmpty(finalGameData.title_jp, ''),
        title_zh: this.dataOrEmpty(finalGameData.title_zh, ''),
        title_en: this.dataOrEmpty(finalGameData.title_en, ''),
        aliases: this.dataOrEmpty(finalGameData.aliases, []),
        intro_jp: this.dataOrEmpty(finalGameData.intro_jp, ''),
        intro_zh: this.dataOrEmpty(finalGameData.intro_zh, ''),
        intro_en: this.dataOrEmpty(finalGameData.intro_en, ''),
        images: this.dataOrEmpty(finalGameData.images, []),
        extra_info: this.dataOrEmpty(finalGameData.extra_info, []),
        tags: this.dataOrEmpty(finalGameData.tags, []),
        staffs: this.dataOrEmpty(finalGameData.staffs, []),
        nsfw: this.dataOrEmpty(finalGameData.nsfw, false),
        type: finalGameData.type,
        platform: this.dataOrEmpty(finalGameData.platform, []),
        creator_id,
      }
      const game = await tx.game.create({ data: gameCreateData })

      if (finalCoversData && finalCoversData.length) {
        const uniqueByUrl = new Map<string, GameCover>()
        for (const c of finalCoversData) {
          if (!uniqueByUrl.has(c.url)) uniqueByUrl.set(c.url, c)
        }
        const covers = Array.from(uniqueByUrl.values())
        if (covers.length) {
          await tx.gameCover.createMany({
            data: covers.map(c => ({
              game_id: game.id,
              language: this.normalizeLang(c.language),
              type: c.type,
              url: c.url,
              dims: c.dims?.length ? c.dims : [0, 0],
            })),
            skipDuplicates: true,
          })
        }
      }

      const findOrCreateDeveloper = async (d: GameDeveloper) => {
        const existing = await tx.gameDeveloper.findFirst({
          where: {
            OR: [
              d.v_id ? { v_id: d.v_id } : undefined,
              d.b_id ? { b_id: d.b_id } : undefined,
              d.name ? { name: d.name } : undefined,
            ].filter(Boolean) as any,
          },
        })
        if (existing) return existing
        const devCreateData: any = {
          v_id: d.v_id,
          b_id: d.b_id,
          name: d.name?.trim() || '',
          aliases: this.dataOrEmpty(d.aliases, []),
          logo: d.logo,
          intro_jp: this.dataOrEmpty(d.intro_jp, ''),
          intro_zh: this.dataOrEmpty(d.intro_zh, ''),
          intro_en: this.dataOrEmpty(d.intro_en, ''),
          extra_info: this.dataOrEmpty(d.extra_info, []),
        }
        return tx.gameDeveloper.create({ data: devCreateData })
      }

      const findOrCreateCharacter = async (c: GameCharacter) => {
        const existing = await tx.gameCharacter.findFirst({
          where: {
            OR: [
              c.v_id ? { v_id: c.v_id } : undefined,
              c.b_id ? { b_id: c.b_id } : undefined,
              c.name_jp ? { name_jp: c.name_jp } : undefined,
            ].filter(Boolean) as any,
          },
        })
        if (existing) return existing
        const chCreateData: any = {
          v_id: c.v_id,
          b_id: c.b_id,
          image: c.image,
          name_jp: c.name_jp || '',
          name_zh: c.name_zh,
          name_en: c.name_en,
          aliases: this.dataOrEmpty(c.aliases, []),
          intro_jp: this.dataOrEmpty(c.intro_jp, ''),
          intro_zh: this.dataOrEmpty(c.intro_zh, ''),
          intro_en: this.dataOrEmpty(c.intro_en, ''),
          gender: c.gender,
          extra_info: this.dataOrEmpty(c.extra_info, []),
        }
        return tx.gameCharacter.create({ data: chCreateData })
      }

      for (const d of finalProducersData || []) {
        const dev = await findOrCreateDeveloper(d)
        await tx.gameDeveloperRelation
          .create({
            data: { game_id: game.id, developer_id: dev.id, role: '开发' },
          })
          .catch(() => {})
      }

      for (const c of finalCharactersData || []) {
        const ch = await findOrCreateCharacter(c)
        await tx.gameCharacterRelation
          .create({
            data: {
              game_id: game.id,
              character_id: ch.id,
              image: c.image,
              actor: c.actor,
              role: c.role,
              extra_info: this.dataOrEmpty(c.extra_info, []),
            },
          })
          .catch(() => {})
      }

      return game.id
    })

    return gameId
  }

  private normalizeLang = (lang?: string) => {
    if (!lang) return 'unknown'
    if (lang.includes('zh')) return 'zh'
    if (lang.includes('ja') || lang.includes('jp')) return 'jp'
    if (lang.includes('en')) return 'en'
    return lang
  }

  private dataOrEmpty = <T>(value: T | undefined | null, fallback: T) =>
    value === undefined || value === null ? fallback : value

  async create() {}
}
