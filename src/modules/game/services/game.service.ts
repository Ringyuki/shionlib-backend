import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import { GetGameListReqDto } from '../dto/req/get-game-list.req.dto'
import { GetGameListResDto } from '../dto/res/get-game-list.res.dto'
import { GetGameResDto } from '../dto/res/get-game.res.dto'

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}
  async getById(id: number): Promise<GetGameResDto> {
    const exist = await this.prisma.game.findUnique({
      where: {
        id,
      },
      select: {
        views: true,
      },
    })
    if (!exist) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }

    const game = await this.prisma.game.update({
      where: {
        id,
      },
      data: {
        views: { increment: 1 },
      },
      select: {
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
              not: 2,
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
          where: {
            sexual: {
              not: 2,
            },
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
      },
    })

    return game as unknown as GetGameResDto
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

  async getList(getGameListReqDto: GetGameListReqDto): Promise<PaginatedResult<GetGameListResDto>> {
    const { page = 1, pageSize = 10 } = getGameListReqDto

    const total = await this.prisma.game.count()
    const games = await this.prisma.game.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
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
      },
    }
  }
}
