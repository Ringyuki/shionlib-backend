import { Controller, Get, Query } from '@nestjs/common'
import { GameDataFetcherService } from '../services/game-data-fetcher.service'

@Controller('game')
export class GameController {
  constructor(private readonly gameDataFetcherService: GameDataFetcherService) {}

  @Get('fetch')
  async fetchDatafromBangumi(@Query('id') id: string) {
    return await this.gameDataFetcherService.fetchDatafromBangumi(id)
  }
}
