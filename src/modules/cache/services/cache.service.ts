import { Injectable } from '@nestjs/common'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { Inject } from '@nestjs/common'

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}
  async get<T>(key: string): Promise<T> {
    return this.cache.get(key) as T
  }
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cache.set(key, value, ttl)
  }
  async del(key: string): Promise<void> {
    await this.cache.del(key)
  }
}
