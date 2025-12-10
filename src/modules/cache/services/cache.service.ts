import { Injectable } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Redis } from 'ioredis'
import { Cache } from 'cache-manager'
import { Inject } from '@nestjs/common'

@Injectable()
export class CacheService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly redis: Redis,
  ) {}

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
