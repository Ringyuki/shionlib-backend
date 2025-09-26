import { Module } from '@nestjs/common'
import { FileScanService } from './services/file-scan.service'
import { FileScanTask } from './tasks/file-scan.task'
import { BullModule } from '@nestjs/bull'
import { LARGE_FILE_UPLOAD_QUEUE } from '../upload/constants/upload.constants'
import { UploadQuotaService } from '../upload/services/upload-quota.service'

@Module({
  providers: [FileScanService, FileScanTask, UploadQuotaService],
  imports: [BullModule.registerQueue({ name: LARGE_FILE_UPLOAD_QUEUE })],
  exports: [],
})
export class SecurityModule {}
