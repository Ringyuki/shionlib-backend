import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { ImageUploadService } from '../services/image-upload.service'

@Injectable()
export class ImageUploadTask {
  private readonly logger: Logger
  constructor(private readonly imageUploadService: ImageUploadService) {
    this.logger = new Logger(ImageUploadTask.name)
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCron() {
    const [coversCount, imagesCount, charactersCount, relationsCount, developersCount] =
      await Promise.all([
        this.imageUploadService.uploadGameCovers(),
        this.imageUploadService.uploadGameImages(),
        this.imageUploadService.uploadGameCharacterImages(),
        this.imageUploadService.uploadGameCharacterRelationImages(),
        this.imageUploadService.uploadGameDeveloperImages(),
      ])

    const count = coversCount + imagesCount + charactersCount + relationsCount + developersCount
    if (count > 0) {
      this.logger.log(`${count} images uploaded`)
    }
  }
}
