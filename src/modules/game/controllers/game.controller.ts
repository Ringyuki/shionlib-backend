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
  Put,
} from '@nestjs/common'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { GameService } from '../services/game.service'
import { GetGameReqDto } from '../dto/req/get-game.req.dto'
import { DeleteGameReqDto } from '../dto/req/delete-game.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { GameDownloadSourceService } from '../services/game-download-resource.service'
import { CreateGameDownloadSourceReqDto } from '../dto/req/create-game-download-source.req.dto'
import { GetGameListReqDto } from '../dto/req/get-game-list.req.dto'
import { SkipThrottle } from '@nestjs/throttler'
import { PaginationReqDto } from '../../../shared/dto/req/pagination.req.dto'

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameDownloadSourceService: GameDownloadSourceService,
  ) {}

  @Get('list')
  async getList(@Query() getGameListReqDto: GetGameListReqDto, @Req() req: RequestWithUser) {
    return await this.gameService.getList(
      { page: getGameListReqDto.page, pageSize: getGameListReqDto.pageSize },
      req.user?.content_limit,
      getGameListReqDto.developer_id,
      getGameListReqDto.filter,
    )
  }

  @Get('recent-update')
  async getRecentUpdate(@Query() getRecentUpdateReqDto: PaginationReqDto) {
    return await this.gameService.getRecentUpdate(getRecentUpdateReqDto)
  }

  @Get(':id')
  async getGame(@Param() getGameReqDto: GetGameReqDto, @Req() req: RequestWithUser) {
    return await this.gameService.getById(getGameReqDto.id, req.user?.sub, req.user?.content_limit)
  }

  @Get(':id/download-source')
  async getDownloadSource(@Param('id', ParseIntPipe) id: number, @Req() req: RequestWithUser) {
    return await this.gameDownloadSourceService.getByGameId(id, req)
  }

  @SkipThrottle({ default: true })
  @Get('download/:id/link')
  async getDownloadSourceLink(
    @Param('id', ParseIntPipe) id: number,
    @Query('token') token: string,
  ) {
    return await this.gameDownloadSourceService.getDownloadLink(id, token)
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
  @Roles(ShionlibUserRoles.ADMIN)
  @Put(':id/recent-update')
  async updateRecentUpdate(@Param('id', ParseIntPipe) id: number) {
    return await this.gameService.addToRecentUpdate(id)
  }

  @UseGuards(JwtAuthGuard)
  @Roles(ShionlibUserRoles.ADMIN)
  @Delete(':id/recent-update')
  async removeFromRecentUpdate(@Param('id', ParseIntPipe) id: number) {
    return await this.gameService.removeFromRecentUpdate(id)
  }
}
