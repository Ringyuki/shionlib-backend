import { Module } from '@nestjs/common'
import { GameController } from './controllers/game.controller'
import { GameDataFetcherService } from './services/game-data-fetcher.service'

@Module({
  controllers: [GameController],
  providers: [GameDataFetcherService],
})
export class GameModule {}
