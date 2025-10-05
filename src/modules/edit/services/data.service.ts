import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class DataService {
  constructor(private readonly prismaService: PrismaService) {}

  async getGameScalar(game_id: number) {
    const game = await this.prismaService.game.findUnique({
      where: { id: game_id },
      select: {
        b_id: true,
        v_id: true,
        title_jp: true,
        title_zh: true,
        title_en: true,
        aliases: true,
        intro_jp: true,
        intro_zh: true,
        intro_en: true,
        platform: true,
        release_date: true,
        extra_info: true,
        tags: true,
        staffs: true,
        nsfw: true,
        views: true,
        type: true,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    return game
  }

  async getGameCover(game_id: number) {
    const game = await this.prismaService.game.findUnique({
      where: { id: game_id },
      select: {
        id: true,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    const covers = await this.prismaService.gameCover.findMany({
      where: { game_id },
      select: {
        id: true,
        url: true,
        type: true,
        dims: true,
        sexual: true,
        violence: true,
        language: true,
      },
    })

    return covers
  }

  async getGameImage(game_id: number) {
    const game = await this.prismaService.game.findUnique({
      where: { id: game_id },
      select: {
        id: true,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }
    const images = await this.prismaService.gameImage.findMany({
      where: { game_id },
      select: {
        id: true,
        url: true,
        dims: true,
        sexual: true,
        violence: true,
      },
    })

    return images
  }
}
