import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import { AdminStatsController } from './controllers/admin-stats.controller'
import { AdminContentController } from './controllers/admin-content.controller'
import { AdminUserController } from './controllers/admin-user.controller'
import { AdminStatsService } from './services/admin-stats.service'
import { AdminContentService } from './services/admin-content.service'
import { AdminUserService } from './services/admin-user.service'

@Module({
  imports: [AuthModule],
  controllers: [AdminStatsController, AdminContentController, AdminUserController],
  providers: [AdminStatsService, AdminContentService, AdminUserService],
  exports: [AdminStatsService, AdminContentService, AdminUserService],
})
export class AdminModule {}
