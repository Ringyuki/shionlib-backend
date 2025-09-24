import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { CreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class GameDownloadSourceService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateGameDownloadSourceReqDto, game_id: number, creator_id: number) {
    if (isNaN(Number(game_id))) {
      throw new ShionBizException(
        ShionBizCode.COMMON_VALIDATION_FAILED,
        'shion-biz.COMMON_VALIDATION_FAILED',
      )
    }
    const game = await this.prismaService.game.findUnique({
      where: {
        id: game_id,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND, 'shion-biz.GAME_NOT_FOUND')
    }
    const session = await this.prismaService.gameUploadSession.findUnique({
      where: {
        id: dto.upload_session_id,
      },
    })
    if (!session) {
      throw new ShionBizException(
        ShionBizCode.GAME_UPLOAD_SESSION_NOT_FOUND,
        'shion-biz.GAME_UPLOAD_SESSION_NOT_FOUND',
      )
    }
    if (session.status !== 'COMPLETED') {
      throw new ShionBizException(
        ShionBizCode.GAME_UPLOAD_INVALID_SESSION_STATUS,
        'shion-biz.GAME_UPLOAD_INVALID_SESSION_STATUS',
      )
    }

    await this.prismaService.$transaction(async tx => {
      const gameDownloadResource = await tx.gameDownloadResource.create({
        data: {
          game_id,
          platform: dto.platform,
          language: dto.language,
          note: dto.note,
          creator_id,
          upload_session_id: dto.upload_session_id,
        },
      })

      await tx.gameDownloadResourceFile.create({
        data: {
          game_download_resource_id: gameDownloadResource.id,
          file_name: session.file_name,
          file_path: session.storage_path,
          file_size: session.total_size,
          file_hash: session.file_sha256,
          creator_id,
          file_status: 1,
          type: 1,
        },
      })
    })
  }
}
