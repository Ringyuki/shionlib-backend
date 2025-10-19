import { Prisma } from '@prisma/client'
import { PrismaService } from '../../../prisma.service'
import type { SearchEngine, SearchQuery } from '../interfaces/search.interface'

export class PgSearchEngine implements SearchEngine {
  constructor(private readonly prisma: PrismaService) {}

  async upsertGame() {}

  async bulkUpsertGames() {}

  async removeGame() {}

  async searchGames(q: SearchQuery) {
    const { page, pageSize, content_limit } = q
    if (!q.q) {
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: pageSize,
          totalPages: 0,
          currentPage: page,
        },
      }
    }

    const where: Prisma.GameWhereInput = {}
    if (!content_limit) {
      where.nsfw = { not: true }
      where.covers = { every: { sexual: { in: [0] } } }
    }

    if (q.q) {
      where.OR = [
        { title_jp: { contains: q.q, mode: 'insensitive' } },
        { title_zh: { contains: q.q, mode: 'insensitive' } },
        { title_en: { contains: q.q, mode: 'insensitive' } },
        { aliases: { has: q.q } },
        { intro_jp: { contains: q.q, mode: 'insensitive' } },
        { intro_zh: { contains: q.q, mode: 'insensitive' } },
        { intro_en: { contains: q.q, mode: 'insensitive' } },
        { tags: { has: q.q } },
        {
          developers: {
            some: {
              developer: { name: { contains: q.q, mode: 'insensitive' }, aliases: { has: q.q } },
            },
          },
        },
        {
          characters: {
            some: {
              character: {
                name_jp: { contains: q.q, mode: 'insensitive' },
                name_en: { contains: q.q, mode: 'insensitive' },
                name_zh: { contains: q.q, mode: 'insensitive' },
                aliases: { has: q.q },
                intro_jp: { contains: q.q, mode: 'insensitive' },
                intro_en: { contains: q.q, mode: 'insensitive' },
                intro_zh: { contains: q.q, mode: 'insensitive' },
              },
            },
          },
        },
        { staffs: { array_contains: q.q } },
      ]
    }

    const [total, items] = await Promise.all([
      this.prisma.game.count({ where }),
      this.prisma.game.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ release_date: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
        select: {
          id: true,
          title_jp: true,
          title_zh: true,
          title_en: true,
          covers: true,
          views: true,
        },
      }),
    ])
    return {
      items,
      meta: {
        totalItems: total,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }
}
