import { Global, Module } from '@nestjs/common'
import { CacheService } from './services/cache.service'
import { Redis } from 'ioredis'

@Global()
@Module({
  providers: [CacheService, Redis],
  exports: [CacheService],
})
export class CacheUtilModule {}
