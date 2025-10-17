import { Module } from '@nestjs/common'
import { DeveloperService } from './services/developer.service'
import { DeveloperController } from './controllers/developer.controller'
import { PrismaService } from '../../prisma.service'

@Module({
  providers: [DeveloperService, PrismaService],
  controllers: [DeveloperController],
})
export class DeveloperModule {}
