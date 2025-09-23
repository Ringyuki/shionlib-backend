import { Module } from '@nestjs/common'
import { LargeFileUploadController } from './controllers/large-file-upload.controller'
import { LargeFileUploadService } from './services/large-file-upload.service'
import { S3Service } from '../s3/services/s3.service'

@Module({
  controllers: [LargeFileUploadController],
  providers: [LargeFileUploadService, S3Service],
  imports: [],
})
export class UploadModule {}
