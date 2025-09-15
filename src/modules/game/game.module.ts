import { Module } from '@nestjs/common'
import { GameController } from './controllers/game.controller'
import { GameDataFetcherService } from './services/game-data-fetcher.service'
import { GameService } from './services/game.service'

@Module({
  controllers: [GameController],
  providers: [GameDataFetcherService, GameService],
  exports: [GameService],
})
export class GameModule {}
