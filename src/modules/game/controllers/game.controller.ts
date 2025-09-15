import { Controller, Get, Query, Post, Body, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../auth/guards/roles.guard'
import { Roles } from '../../auth/decorators/roles.decorator'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { GameDataFetcherService } from '../services/game-data-fetcher.service'
import { FetchGameDataReqDto } from '../dto/req/fetch-game-data.req.dto'
import { GameService } from '../services/game.service'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { CreateGameFromBangumiAndVNDBReqDto } from '../dto/req/create-game-from-bangumi-and-vndb.req.dto'
import { CreateGameCoverReqDto } from '../dto/req/create-game-cover.req.dto'

@Controller('game')
export class GameController {
  constructor(
    private readonly gameDataFetcherService: GameDataFetcherService,
    private readonly gameService: GameService,
  ) {}

  @Get('fetch')
  async fetchData(@Query() fetchGameDataReqDto: FetchGameDataReqDto) {
    return await this.gameDataFetcherService.fetchData(
      fetchGameDataReqDto.b_id,
      fetchGameDataReqDto.v_id,
    )
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ShionlibUserRoles.ADMIN)
  async createGame(
    @Body() createGameReqDto: CreateGameFromBangumiAndVNDBReqDto,
    @Req() req: RequestWithUser,
  ) {
    return await this.gameService.createFromBangumiAndVNDB(
      createGameReqDto.b_id,
      createGameReqDto.v_id,
      req.user.sub,
    )
  }

  @Post('create/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ShionlibUserRoles.ADMIN)
  async createGameCover(
    @Body() createGameCoverReqDto: CreateGameCoverReqDto,
    @Req() req: RequestWithUser,
  ) {
    // return await this.gameService.createGameCover(createGameCoverReqDto, req.user.sub)
  }
}
