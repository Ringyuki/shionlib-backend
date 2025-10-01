import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FileScanService } from '../services/file-scan.service'

@Injectable()
export class FileScanTask {
  private readonly logger = new Logger(FileScanTask.name)
  constructor(private readonly fileScanService: FileScanService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    try {
      const count = await this.fileScanService.scanFiles()
      if (count > 0) {
        this.logger.log(`${count} files scanned successfully`)
      }
    } catch (error) {
      this.logger.error('Error scanning files', error)
    }
  }
}
