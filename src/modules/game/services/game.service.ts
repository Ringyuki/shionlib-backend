import { Inject, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import { GetGameListResDto } from '../dto/res/get-game-list.res.dto'
import { GetGameResDto } from '../dto/res/get-game.res.dto'
import { Prisma } from '@prisma/client'
import { PaginationReqDto } from '../../../shared/dto/req/pagination.req.dto'
import { UserContentLimit } from '../../user/interfaces/user.interface'
import { GetGameListFilterReqDto } from '../dto/req/get-game-list.req.dto'
import { applyDate } from '../helpers/date-filters'
import { CacheService } from '../../cache/services/cache.service'
import { RECENT_UPDATE_KEY, RECENT_UPDATE_TTL_MS } from '../constants/recent-update.constant'
import { SearchEngine, SEARCH_ENGINE } from '../../search/interfaces/search.interface'

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    @Inject(SEARCH_ENGINE) private readonly searchEngine: SearchEngine,
  ) {}
  async getById(id: number, user_id?: number, content_limit?: number): Promise<GetGameResDto> {
    const exist = await this.prisma.game.findUnique({
      where: {
        id,
      },
      select: {
        views: true,
        nsfw: true,
        covers: {
          select: {
            sexual: true,
          },
        },
      },
    })
    if (!exist) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    if (
      (exist.nsfw || exist.covers.some(c => c.sexual > 0)) &&
      (content_limit === UserContentLimit.NEVER_SHOW_NSFW_CONTENT || !content_limit)
    ) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }

    const select: Prisma.GameSelect = {
      v_id: true,
      id: true,
      title_jp: true,
      title_zh: true,
      title_en: true,
      aliases: true,
      intro_jp: true,
      intro_zh: true,
      intro_en: true,
      images: {
        select: {
          url: true,
          dims: true,
          sexual: true,
          violence: true,
        },
        where: {
          sexual: {
            in: [0],
          },
        },
      },
      release_date: true,
      release_date_tba: true,
      extra_info: true,
      tags: true,
      staffs: true,
      nsfw: true,
      type: true,
      platform: true,
      covers: {
        select: {
          language: true,
          type: true,
          url: true,
          dims: true,
          sexual: true,
          violence: true,
        },
      },
      developers: {
        select: {
          role: true,
          developer: {
            select: {
              id: true,
              name: true,
              aliases: true,
            },
          },
        },
      },
      characters: {
        select: {
          role: true,
          image: true,
          actor: true,
          character: {
            select: {
              id: true,
              image: true,
              name_jp: true,
              name_zh: true,
              name_en: true,
              aliases: true,
              intro_jp: true,
              intro_zh: true,
              intro_en: true,
              gender: true,
              blood_type: true,
              height: true,
              weight: true,
              bust: true,
              waist: true,
              hips: true,
              cup: true,
              age: true,
              birthday: true,
            },
          },
        },
      },
      link: {
        select: {
          id: true,
          url: true,
          label: true,
          name: true,
        },
      },
      comments: true,
      creator: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    }
    if (user_id) {
      if (content_limit !== UserContentLimit.NEVER_SHOW_NSFW_CONTENT) {
        select.images = {
          select: {
            url: true,
            dims: true,
            sexual: true,
            violence: true,
          },
        }
      }
    }
    const game = await this.prisma.game.update({
      where: {
        id,
      },
      data: {
        views: { increment: 1 },
      },
      select,
    })

    const isFavorite = await this.prisma.favoriteItem.findFirst({
      where: {
        game_id: id,
        favorite: {
          user_id,
        },
      },
    })

    const data = {
      ...game,
      content_limit,
    } as unknown as GetGameResDto

    if (user_id) {
      data.is_favorite = !!isFavorite
    }

    return data
  }

  async deleteById(id: number) {
    const exist = await this.prisma.game.findUnique({
      where: {
        id,
      },
    })
    if (!exist) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    await this.prisma.game.delete({
      where: {
        id,
      },
    })
    await this.searchEngine.deleteGame(id)
  }

  async getList(
    getGameListReqDto: PaginationReqDto,
    content_limit?: number,
    producer_id?: number,
    character_id?: number,
    filter?: GetGameListFilterReqDto,
  ): Promise<PaginatedResult<GetGameListResDto>> {
    const { page = 1, pageSize = 10 } = getGameListReqDto
    const { tags, years, months, sort_by, sort_order, start_date, end_date } = filter ?? {}

    let where: Prisma.GameWhereInput = {}
    if (content_limit === UserContentLimit.NEVER_SHOW_NSFW_CONTENT || !content_limit) {
      where.nsfw = {
        not: true,
      }
      where.covers = {
        every: {
          sexual: {
            in: [0],
          },
        },
      }
    }
    if (producer_id)
      where.developers = {
        some: {
          developer: {
            id: producer_id,
          },
        },
      }
    if (character_id)
      where.characters = {
        some: {
          character: {
            id: character_id,
          },
        },
      }

    if (tags)
      where.tags = {
        hasSome: tags,
      }

    if (start_date && end_date) {
      const [from, to] = start_date <= end_date ? [start_date, end_date] : [end_date, start_date]
      where.release_date = {
        gte: new Date(from),
        lte: new Date(to),
      }
    } else if (years || months) where = applyDate(where, { years, months })
    if (start_date || end_date || years || months) {
      where.release_date_tba = {
        not: true,
      }
    }

    const orderByArray: Prisma.GameOrderByWithRelationInput[] = []
    orderByArray.push({ release_date_tba: 'asc' })
    if (sort_by) {
      orderByArray.push({ [sort_by]: sort_order } as Prisma.GameOrderByWithRelationInput)
    } else {
      orderByArray.push({ release_date: 'desc' })
    }
    orderByArray.push({ id: 'desc' })

    const total = await this.prisma.game.count({
      where,
    })
    const games = await this.prisma.game.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: orderByArray,
      where,
      select: {
        id: true,
        title_jp: true,
        title_zh: true,
        title_en: true,
        aliases: true,
        type: true,
        covers: {
          select: {
            language: true,
            type: true,
            dims: true,
            sexual: true,
            violence: true,
            url: true,
          },
        },
        views: true,
      },
    })

    return {
      items: games,
      meta: {
        totalItems: total,
        itemCount: games.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
        content_limit,
      },
    }
  }

  async addToRecentUpdate(game_id: number) {
    const now = Date.now()
    await this.cacheService.zadd(RECENT_UPDATE_KEY, now, game_id)
    const expiredBefore = now - RECENT_UPDATE_TTL_MS
    await this.cacheService.zremrangebyscore(RECENT_UPDATE_KEY, '-inf', expiredBefore)
  }

  async removeFromRecentUpdate(game_id: number) {
    await this.cacheService.zrem(RECENT_UPDATE_KEY, game_id)
  }

  async getRecentUpdate(dto: PaginationReqDto): Promise<PaginatedResult<GetGameListResDto>> {
    const { page = 1, pageSize = 100 } = dto
    const start = (page - 1) * pageSize
    const end = start + pageSize - 1
    const now = Date.now()
    const expiredBefore = now - RECENT_UPDATE_TTL_MS
    await this.cacheService.zremrangebyscore(RECENT_UPDATE_KEY, '-inf', expiredBefore)

    const items = await this.cacheService.zrangeWithScores(RECENT_UPDATE_KEY, start, end, 'DESC')
    const gameIds = items.map(item => Number(item.member))
    const total = gameIds.length
    const games = await this.prisma.game.findMany({
      skip: start,
      take: pageSize,
      where: {
        id: { in: gameIds },
      },
      select: {
        id: true,
        title_jp: true,
        title_zh: true,
        title_en: true,
        aliases: true,
        type: true,
        covers: {
          select: {
            language: true,
            type: true,
            dims: true,
            sexual: true,
            violence: true,
            url: true,
          },
        },
        views: true,
      },
    })
    return {
      items: games,
      meta: {
        totalItems: total,
        itemCount: games.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }
}
