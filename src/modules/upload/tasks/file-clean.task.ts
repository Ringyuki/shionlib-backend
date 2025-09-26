import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { FileCleanService } from '../services/file-clean.service'

@Injectable()
export class FileCleanTask {
  constructor(private readonly fileCleanService: FileCleanService) {}
  private readonly logger = new Logger(FileCleanTask.name)

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    this.logger.log('Cleaning files...')
    try {
      await this.fileCleanService.clean()
      this.logger.log('Files cleaned successfully')
    } catch (error) {
      this.logger.error('Error cleaning files', error)
    }
  }
}
