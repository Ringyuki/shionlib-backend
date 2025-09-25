import {
  Controller,
  Put,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  ParseIntPipe,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import type { Express } from 'express'
import { SmallFileUploadService } from '../services/small-file-upload.service'

@UseGuards(JwtAuthGuard)
@Controller('uploads/small')
export class SmallFileUploadController {
  constructor(private readonly smallFileUploadService: SmallFileUploadService) {}

  @Put('game/:game_id/cover')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const ok = /^image\/(jpeg|png|webp|avif)$/.test(file.mimetype)
        cb(
          ok
            ? null
            : new ShionBizException(
                ShionBizCode.SMALL_FILE_UPLOAD_UNSUPPORTED_FILE_TYPE,
                'shion-biz.SMALL_FILE_UPLOAD_UNSUPPORTED_FILE_TYPE',
              ),
          ok,
        )
      },
    }),
  )
  async uploadGameCover(
    @Param('game_id', ParseIntPipe) game_id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.smallFileUploadService.uploadGameCover(game_id, file)
  }
}
