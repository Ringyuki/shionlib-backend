import { Module } from '@nestjs/common'
import { AdminStatsController } from './controllers/admin-stats.controller'
import { AdminContentController } from './controllers/admin-content.controller'
import { AdminStatsService } from './services/admin-stats.service'
import { AdminContentService } from './services/admin-content.service'

@Module({
  controllers: [AdminStatsController, AdminContentController],
  providers: [AdminStatsService, AdminContentService],
  exports: [AdminStatsService, AdminContentService],
})
export class AdminModule {}
