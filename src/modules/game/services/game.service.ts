import { Injectable } from '@nestjs/common'
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

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}
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
      download_resources: true,
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

    const isFavorite = await this.prisma.gameFavoriteRelation.findFirst({
      where: {
        game_id: id,
        user_id,
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
  }

  async getList(
    getGameListReqDto: PaginationReqDto,
    content_limit?: number,
    producer_id?: number,
    filter?: GetGameListFilterReqDto,
  ): Promise<PaginatedResult<GetGameListResDto>> {
    const { page = 1, pageSize = 10 } = getGameListReqDto
    const { tags, years, months, sort_by, sort_order } = filter ?? {}

    let where: Prisma.GameWhereInput = {}
    let orderBy: Prisma.GameOrderByWithRelationInput = {
      release_date: 'desc',
    }
    if (content_limit === UserContentLimit.NEVER_SHOW_NSFW_CONTENT || !content_limit) {
      where.nsfw = {
        not: true,
      }
      where.covers = {
        some: {
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

    if (tags)
      where.tags = {
        hasSome: tags,
      }

    if (years || months) where = applyDate(where, { years, months })

    if (sort_by)
      orderBy = {
        [sort_by]: sort_order,
      }

    const total = await this.prisma.game.count({
      where,
    })
    const games = await this.prisma.game.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy,
      where,
      select: {
        id: true,
        title_jp: true,
        title_zh: true,
        title_en: true,
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

  async favoriteGame(game_id: number, user_id: number) {
    const exist = await this.prisma.gameFavoriteRelation.findFirst({
      where: {
        game_id,
        user_id,
      },
    })
    if (exist) {
      await this.prisma.gameFavoriteRelation.delete({
        where: {
          id: exist.id,
        },
      })
    } else {
      await this.prisma.gameFavoriteRelation.create({
        data: {
          game_id,
          user_id,
        },
      })
    }
  }
}
