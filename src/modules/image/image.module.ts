import { Global, Module } from '@nestjs/common'
import { ImageProcessService } from './services/image-process.service'

@Global()
@Module({
  providers: [ImageProcessService],
  exports: [ImageProcessService],
})
export class ImageModule {}
