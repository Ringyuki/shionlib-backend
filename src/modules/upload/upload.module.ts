import { Module } from '@nestjs/common'
import { LargeFileUploadController } from './controllers/large-file-upload.controller'
import { LargeFileUploadService } from './services/large-file-upload.service'
import { SmallFileUploadController } from './controllers/small-file-upload.controller'
import { SmallFileUploadService } from './services/small-file-upload.service'
import { S3Module } from '../s3/s3.module'
import { UploadProcessor } from './queues/upload.processor'
import { LARGE_FILE_UPLOAD_QUEUE } from './constants/upload.constants'
import { BullModule } from '@nestjs/bull'

@Module({
  controllers: [LargeFileUploadController, SmallFileUploadController],
  providers: [LargeFileUploadService, SmallFileUploadService, UploadProcessor],
  imports: [S3Module, BullModule.registerQueue({ name: LARGE_FILE_UPLOAD_QUEUE })],
  exports: [BullModule],
})
export class UploadModule {}
