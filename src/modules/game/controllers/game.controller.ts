import { Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { GameService } from '../services/game.service'
import { GetGameReqDto } from '../dto/req/get-game.req.dto'
import { DeleteGameReqDto } from '../dto/req/delete-game.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { GetGameListReqDto } from '../dto/req/get-game-list.req.dto'

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get('list')
  async getList(@Query() getGameListReqDto: GetGameListReqDto) {
    return await this.gameService.getList(getGameListReqDto)
  }

  @Get(':id')
  async getGame(@Param() getGameReqDto: GetGameReqDto, @Req() req: RequestWithUser) {
    return await this.gameService.getById(getGameReqDto.id, req.user?.sub)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ShionlibUserRoles.ADMIN)
  @Delete(':id')
  async deleteGame(@Param() deleteGameReqDto: DeleteGameReqDto) {
    return await this.gameService.deleteById(deleteGameReqDto.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async favoriteGame(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.gameService.favoriteGame(Number(id), req.user?.sub)
  }
}
