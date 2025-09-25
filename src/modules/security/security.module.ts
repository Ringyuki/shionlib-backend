import { Module } from '@nestjs/common'
import { FileScanService } from './services/file-scan.service'
import { FileScanTask } from './tasks/file-scan.task'

@Module({
  providers: [FileScanService, FileScanTask],
  exports: [FileScanService],
})
export class SecurityModule {}
