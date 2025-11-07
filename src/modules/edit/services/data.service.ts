import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { PaginationReqDto } from '../../../shared/dto/req/pagination.req.dto'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import { EditRecordItem } from '../../user/dto/res/edit-records.res.dto'

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

  async getGameEditHistory(
    game_id: number,
    dto: PaginationReqDto,
  ): Promise<PaginatedResult<EditRecordItem>> {
    const game = await this.prismaService.game.findUnique({
      where: { id: game_id },
      select: {
        id: true,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }

    const { page, pageSize } = dto
    const total = await this.prismaService.editRecord.count({
      where: {
        target_id: game_id,
        entity: 'game',
      },
    })
    const history = await this.prismaService.editRecord.findMany({
      where: {
        target_id: game_id,
        entity: 'game',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        created: 'desc',
      },
      select: {
        id: true,
        entity: true,
        target_id: true,
        action: true,
        field_changes: true,
        changes: true,
        actor: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        note: true,
        created: true,
        updated: true,
      },
    })
    return {
      items: history as unknown as EditRecordItem[],
      meta: {
        totalItems: total,
        itemCount: history.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }
}
