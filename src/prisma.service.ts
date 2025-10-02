import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({ log: ['error'] })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.$on('error' as never, event => {
        this.logger.error(event)
      })
      this.logger.log('Prisma connected')
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Prisma disconnected')
  }
}
