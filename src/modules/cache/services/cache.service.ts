import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import IORedis, { Redis } from 'ioredis'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { Cache } from 'cache-manager'
import { Inject } from '@nestjs/common'

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name)
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private redis: Redis,
    private readonly configService: ShionConfigService,
  ) {}

  async onModuleInit() {
    const host = this.configService.get('redis.host')
    const port = this.configService.get('redis.port')
    const password = this.configService.get('redis.password')
    const database = this.configService.get('redis.database')
    const keyPrefix = this.configService.get('redis.keyPrefix')

    if (!host || !port || !database) {
      throw new Error('Redis host, port and database are required')
    }
    this.logger.log(
      `Redis config: host=${host}; port=${port}; password=${password}; database=${database}`,
    )

    this.redis = new IORedis({
      host,
      port,
      password,
      keyPrefix,
      db: database,
    })
  }

  async onModuleDestroy() {
    await this.redis.quit()
  }

  async get<T>(key: string): Promise<T> {
    return this.cache.get(key) as T
  }

  async set<T>(key: string, value: T, ttlMs: number): Promise<void> {
    await this.cache.set(key, value, ttlMs)
  }

  async setnx(
    key: string,
    value: string | number | Buffer<ArrayBufferLike>,
    callback?: () => Promise<void>,
  ) {
    return this.redis.setnx(key, value, callback)
  }

  async del(key: string): Promise<void> {
    await this.cache.del(key)
  }
}
