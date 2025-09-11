import { Global, Module } from '@nestjs/common'
import { CacheService } from './services/cache.service'

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheUtilModule {}
