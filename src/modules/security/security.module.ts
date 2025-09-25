import { Module } from '@nestjs/common'
import { FileScanService } from './services/file-scan.service'

@Module({
  providers: [FileScanService],
  exports: [FileScanService],
})
export class SecurityModule {}
