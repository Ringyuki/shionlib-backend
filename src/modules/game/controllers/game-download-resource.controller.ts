import { Controller, UseGuards, Post, Body, Param, ParseIntPipe } from '@nestjs/common'
import { GameDownloadSourceService } from '../services/game-download-resource.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { MigrateCreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'
import { CreateGameDownloadSourceFileReqDto } from '../dto/req/create-game-download-source-file.req.dto'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ShionlibUserRoles.SUPER_ADMIN)
@Controller('migrate/game-download-resource')
export class GameDownloadResourceController {
  constructor(private readonly gameDownloadResourceService: GameDownloadSourceService) {}

  @Post(':game_id')
  async createDownloadResource(
    @Body() migrateCreateDownloadResourceReqDto: MigrateCreateGameDownloadSourceReqDto,
    @Param('game_id', ParseIntPipe) game_id: number,
  ) {
    return await this.gameDownloadResourceService.migrateCreate(
      migrateCreateDownloadResourceReqDto,
      game_id,
    )
  }

  @Post('file/:download_resource_id')
  async createDownloadResourceFile(
    @Body() createDownloadResourceFileReqDto: CreateGameDownloadSourceFileReqDto,
    @Param('download_resource_id', ParseIntPipe) download_resource_id: number,
  ) {
    return await this.gameDownloadResourceService.migrateCreateFile(
      createDownloadResourceFileReqDto,
      download_resource_id,
    )
  }
}
