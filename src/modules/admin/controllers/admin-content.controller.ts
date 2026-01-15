import { Controller, Get, Patch, Param, Query, Body, UseGuards, ParseIntPipe } from '@nestjs/common'
import { AdminContentService } from '../services/admin-content.service'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { AdminGameListReqDto } from '../dto/req/game-list.req.dto'
import { AdminCharacterListReqDto, AdminDeveloperListReqDto } from '../dto/req/content-list.req.dto'

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(ShionlibUserRoles.ADMIN)
@Controller('admin/content')
export class AdminContentController {
  constructor(private readonly adminContentService: AdminContentService) {}

  @Get('games')
  async getGameList(@Query() query: AdminGameListReqDto) {
    return this.adminContentService.getGameList(query)
  }

  @Patch('games/:id/status')
  async updateGameStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', ParseIntPipe) status: number,
  ) {
    return await this.adminContentService.updateGameStatus(id, status)
  }

  @Get('characters')
  async getCharacterList(@Query() query: AdminCharacterListReqDto) {
    return this.adminContentService.getCharacterList(query)
  }

  @Get('developers')
  async getDeveloperList(@Query() query: AdminDeveloperListReqDto) {
    return this.adminContentService.getDeveloperList(query)
  }
}
