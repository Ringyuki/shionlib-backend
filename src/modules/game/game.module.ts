import { Module } from '@nestjs/common'
import { GameCreateController } from './controllers/game-create.controller'
import { GameController } from './controllers/game.controller'
import { GameDataFetcherService } from './services/game-data-fetcher.service'
import { GameService } from './services/game.service'
import { GameCreateService } from './services/game-create.service'

@Module({
  controllers: [GameCreateController, GameController],
  providers: [GameDataFetcherService, GameService, GameController, GameCreateService],
})
export class GameModule {}
