import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { CreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { S3Service } from '../../s3/services/s3.service'
import { GAME_STORAGE } from '../../s3/constants/s3.constants'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'

@Injectable()
export class GameDownloadSourceService {
  constructor(
    private readonly prismaService: PrismaService,
    @Inject(GAME_STORAGE) private readonly s3Service: S3Service,
  ) {}

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
    if (session.creator_id !== creator_id) {
      throw new ShionBizException(
        ShionBizCode.GAME_UPLOAD_SESSION_NOT_OWNER,
        'shion-biz.GAME_UPLOAD_SESSION_NOT_OWNER',
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
          file_content_type: session.mime_type,
          creator_id,
          file_status: 2,
          type: 1,
        },
      })
    })
  }

  async delete(id: number, req: RequestWithUser) {
    const resource = await this.prismaService.gameDownloadResource.findUnique({
      where: {
        id,
      },
    })
    if (!resource) {
      throw new ShionBizException(
        ShionBizCode.GAME_DOWNLOAD_RESOURCE_NOT_FOUND,
        'shion-biz.GAME_DOWNLOAD_RESOURCE_NOT_FOUND',
      )
    }
    if (
      resource.creator_id !== req.user?.sub &&
      ![ShionlibUserRoles.ADMIN, ShionlibUserRoles.SUPER_ADMIN].includes(req.user?.role)
    ) {
      throw new ShionBizException(
        ShionBizCode.GAME_DOWNLOAD_RESOURCE_NOT_OWNER,
        'shion-biz.GAME_DOWNLOAD_RESOURCE_NOT_OWNER',
      )
    }
    const files = await this.prismaService.gameDownloadResourceFile.findMany({
      where: {
        game_download_resource_id: resource.id,
      },
    })
    for (const file of files) {
      if (file.s3_file_key) {
        await this.s3Service.deleteFile(file.s3_file_key)
      }
    }
    await this.prismaService.gameDownloadResource.delete({
      where: {
        id,
      },
    })
  }
}
