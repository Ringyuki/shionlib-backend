import {
  Controller,
  UseGuards,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Req,
  Patch,
  Get,
  Query,
  Delete,
} from '@nestjs/common'
import { GameDownloadSourceService } from '../services/game-download-resource.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { MigrateCreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'
import { CreateGameDownloadSourceFileReqDto } from '../dto/req/create-game-download-source-file.req.dto'
import { EditGameDownloadSourceReqDto } from '../dto/req/edit-game-download-source.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { PaginationReqDto } from '../../../shared/dto/req/pagination.req.dto'

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('game/download-source')
export class GameDownloadSourceController {
  constructor(private readonly gameDownloadSourceService: GameDownloadSourceService) {}

  @Get('list')
  async getDownloadSourceList(@Query() getDownloadSourceListReqDto: PaginationReqDto) {
    return await this.gameDownloadSourceService.getList(getDownloadSourceListReqDto)
  }

  @Delete(':id')
  async deleteDownloadResource(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return await this.gameDownloadSourceService.delete(id, req)
  }

  @Patch(':id')
  async editDownloadResource(
    @Body() editDownloadResourceReqDto: EditGameDownloadSourceReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return await this.gameDownloadSourceService.edit(id, editDownloadResourceReqDto, req)
  }

  @Roles(ShionlibUserRoles.SUPER_ADMIN)
  @Post('migrate/:game-id')
  async createDownloadResource(
    @Body() migrateCreateDownloadResourceReqDto: MigrateCreateGameDownloadSourceReqDto,
    @Param('game-id', ParseIntPipe) game_id: number,
  ) {
    return await this.gameDownloadSourceService.migrateCreate(
      migrateCreateDownloadResourceReqDto,
      game_id,
    )
  }

  @Roles(ShionlibUserRoles.SUPER_ADMIN)
  @Post('migrate/file/:download-source-id')
  async createDownloadResourceFile(
    @Body() createDownloadResourceFileReqDto: CreateGameDownloadSourceFileReqDto,
    @Param('download-source-id', ParseIntPipe) download_source_id: number,
  ) {
    return await this.gameDownloadSourceService.migrateCreateFile(
      createDownloadResourceFileReqDto,
      download_source_id,
    )
  }
}
