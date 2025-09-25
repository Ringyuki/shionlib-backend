import { Module } from '@nestjs/common'
import { LargeFileUploadController } from './controllers/large-file-upload.controller'
import { LargeFileUploadService } from './services/large-file-upload.service'
import { SmallFileUploadController } from './controllers/small-file-upload.controller'
import { SmallFileUploadService } from './services/small-file-upload.service'
import { S3Module } from '../s3/s3.module'

@Module({
  controllers: [LargeFileUploadController, SmallFileUploadController],
  providers: [LargeFileUploadService, SmallFileUploadService],
  imports: [S3Module],
})
export class UploadModule {}
