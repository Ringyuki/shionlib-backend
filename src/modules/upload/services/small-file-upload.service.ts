import { Inject, Injectable, Logger } from '@nestjs/common'
import { S3Service } from '../../s3/services/s3.service'
import { IMAGE_STORAGE } from '../../s3/constants/s3.constants'
import { randomUUID as nodeRandomUUID } from 'node:crypto'
import { ImageProcessService } from '../../image/services/image-process.service'
import { TargetFormatEnum } from '../../image/dto/req/image-process.req.dto'
import { ImageProcessResDto } from '../../image/dto/res/image-process.res.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { PrismaService } from '../../../prisma.service'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { nativeFetch } from '../../render/providers/dom-env.provider'

@Injectable()
export class SmallFileUploadService {
  private readonly logger: Logger
  constructor(
    @Inject(IMAGE_STORAGE) private readonly s3Service: S3Service,
    private readonly imageProcessService: ImageProcessService,
    private readonly prismaService: PrismaService,
  ) {
    this.logger = new Logger(SmallFileUploadService.name)
  }

  async uploadGameCover(game_id: number, file: Express.Multer.File, req: RequestWithUser) {
    const game = await this.prismaService.game.findUnique({
      where: {
        id: game_id,
      },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND, 'shion-biz.GAME_NOT_FOUND')
    }
    if (!file) {
      throw new ShionBizException(
        ShionBizCode.SMALL_FILE_UPLOAD_FILE_NO_FILE_PROVIDED,
        'shion-biz.SMALL_FILE_UPLOAD_FILE_NO_FILE_PROVIDED',
      )
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new ShionBizException(
        ShionBizCode.SMALL_FILE_UPLOAD_FILE_SIZE_EXCEEDS_LIMIT,
        'shion-biz.SMALL_FILE_UPLOAD_FILE_SIZE_EXCEEDS_LIMIT',
      )
    }

    const data = await this.imageProcessService.process(Buffer.from(file.buffer), {
      format: TargetFormatEnum.WEBP,
    })
    const key = `game/${game_id}/cover/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      game_id: game_id.toString(),
      uploader_id: req.user.sub.toString(),
    })
    return {
      key,
    }
  }

  async uploadGameImage(game_id: number, file: Express.Multer.File) {
    const data = await this.imageProcessService.process(Buffer.from(file.buffer), {
      format: TargetFormatEnum.WEBP,
    })
    const key = `game/${game_id}/image/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key)
    return {
      key,
    }
  }

  private async _upload(dto: ImageProcessResDto, key: string, metadata?: Record<string, string>) {
    try {
      const buffer = Buffer.from(dto.data)
      await this.s3Service.uploadFile(key, buffer, dto.mime, metadata)
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  async _uploadGameCover(game_id: number, url: string) {
    const image_raw = await nativeFetch(url).then(res => res.arrayBuffer())
    const image_buffer = Buffer.from(image_raw)
    const data = await this.imageProcessService.process(image_buffer, {
      format: TargetFormatEnum.WEBP,
    })
    const key = `game/${game_id}/cover/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      game_id: game_id.toString(),
    })
    return {
      key,
    }
  }

  async _uploadGameImage(game_id: number, url: string) {
    const image_raw = await nativeFetch(url).then(res => res.arrayBuffer())
    const image_buffer = Buffer.from(image_raw)
    const data = await this.imageProcessService.process(image_buffer, {
      format: TargetFormatEnum.WEBP,
    })
    const key = `game/${game_id}/image/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      game_id: game_id.toString(),
    })
    return {
      key,
    }
  }

  async _uploadGameCharacterImage(character_id: number, url: string) {
    const image_raw = await nativeFetch(url).then(res => res.arrayBuffer())
    const image_buffer = Buffer.from(image_raw)
    const data = await this.imageProcessService.process(image_buffer, {
      format: TargetFormatEnum.WEBP,
    })
    const key = `character/${character_id}/image/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      character_id: character_id.toString(),
    })
    return {
      key,
    }
  }

  async _uploadGameCharacterRelationImage(character_id: number, url: string) {
    const image_raw = await nativeFetch(url).then(res => res.arrayBuffer())
    const image_buffer = Buffer.from(image_raw)
    const data = await this.imageProcessService.process(image_buffer, {
      format: TargetFormatEnum.WEBP,
    })
    const key = `character/${character_id}/image/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      character_id: character_id.toString(),
    })
    return {
      key,
    }
  }

  async _uploadGameDeveloperImage(developer_id: number, url: string) {
    const image_raw = await nativeFetch(url).then(res => res.arrayBuffer())
    const image_buffer = Buffer.from(image_raw)
    const data = await this.imageProcessService.process(image_buffer, {
      format: TargetFormatEnum.WEBP,
    })
    const key = `developer/${developer_id}/image/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      developer_id: developer_id.toString(),
    })
    return {
      key,
    }
  }

  async _uploadUserAvatar(user_id: number, file: Express.Multer.File) {
    const data = await this.imageProcessService.process(Buffer.from(file.buffer), {
      format: TargetFormatEnum.WEBP,
      maxWidth: 233,
      maxHeight: 233,
    })
    const key = `user/${user_id}/avatar/${nodeRandomUUID()}${data.filenameSuffix}`
    await this._upload(data, key, {
      user_id: user_id.toString(),
    })
    return {
      key,
    }
  }
}
