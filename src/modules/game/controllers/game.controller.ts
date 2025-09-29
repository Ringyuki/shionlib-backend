import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Body,
  ParseIntPipe,
} from '@nestjs/common'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { GameService } from '../services/game.service'
import { GetGameReqDto } from '../dto/req/get-game.req.dto'
import { DeleteGameReqDto } from '../dto/req/delete-game.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { GetGameListReqDto } from '../dto/req/get-game-list.req.dto'
import { GameDownloadSourceService } from '../services/game-download-resource.service'
import { CreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameDownloadSourceService: GameDownloadSourceService,
  ) {}

  @Get('list')
  async getList(@Query() getGameListReqDto: GetGameListReqDto) {
    return await this.gameService.getList(getGameListReqDto)
  }

  @Get(':id')
  async getGame(@Param() getGameReqDto: GetGameReqDto, @Req() req: RequestWithUser) {
    return await this.gameService.getById(getGameReqDto.id, req.user?.sub)
  }

  @Get(':id/download-source')
  async getDownloadSource(@Param('id', ParseIntPipe) id: number) {
    return await this.gameDownloadSourceService.getByGameId(id)
  }

  @Get('download/:id/link')
  async getDownloadSourceLink(@Param('id', ParseIntPipe) id: number) {
    return await this.gameDownloadSourceService.getDownloadLink(id)
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ShionlibUserRoles.ADMIN)
  @Delete(':id')
  async deleteGame(@Param() deleteGameReqDto: DeleteGameReqDto) {
    return await this.gameService.deleteById(deleteGameReqDto.id)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async favoriteGame(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return await this.gameService.favoriteGame(id, req.user?.sub)
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/download-source')
  async createDownloadSource(
    @Param('id', ParseIntPipe) id: number,
    @Body() createGameDownloadSourceReqDto: CreateGameDownloadSourceReqDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.gameDownloadSourceService.create(
      createGameDownloadSourceReqDto,
      id,
      req.user?.sub,
    )
  }

  @UseGuards(JwtAuthGuard)
  @Delete('download-source/:downloadSourceId')
  async deleteDownloadSource(
    @Param('downloadSourceId', ParseIntPipe) downloadSourceId: number,
    @Req() req: RequestWithUser,
  ) {
    return await this.gameDownloadSourceService.delete(downloadSourceId, req)
  }
}
