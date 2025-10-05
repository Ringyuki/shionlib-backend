import { Module, Global } from '@nestjs/common'
import { SeedService } from './services/seed.service'
import { PermissionService } from './services/permission.service'
import { PermissionController } from './controllers/permission.controller'
import { EditController } from './controllers/edit.controller'
import { DataService } from './services/data.service'

@Global()
@Module({
  controllers: [PermissionController, EditController],
  providers: [SeedService, PermissionService, DataService],
  exports: [SeedService, PermissionService],
})
export class EditModule {}
