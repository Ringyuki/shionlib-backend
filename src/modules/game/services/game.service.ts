import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class GameService {
  constructor(private readonly prisma: PrismaService) {}
  async getById(id: number) {
    const exist = await this.prisma.game.findUnique({
      where: {
        id,
      },
    })
    if (!exist) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    const game = await this.prisma.game.findUnique({
      where: {
        id,
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
        images: true,
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
                intro_jp: true,
                intro_zh: true,
                intro_en: true,
                gender: true,
              },
            },
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

    return game
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
}
