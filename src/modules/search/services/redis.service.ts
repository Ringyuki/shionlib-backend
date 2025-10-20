import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import IORedis, { Redis } from 'ioredis'
import { ShionConfigService } from '../../../common/config/services/config.service'

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
  private client: Redis

  constructor(private readonly configService: ShionConfigService) {}

  async onModuleInit() {
    const host = this.configService.get('redis.host')
    const port = this.configService.get('redis.port')
    const password = this.configService.get('redis.password')
    const database = this.configService.get('redis.database')

    this.client = new IORedis({
      host,
      port,
      password,
      db: database,
    })
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
    }
  }

  async getClient() {
    return this.client
  }
}
