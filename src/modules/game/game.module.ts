import { Module } from '@nestjs/common'
import { GameCreateController } from './controllers/game-create.controller'
import { GameController } from './controllers/game.controller'
import { GameDataFetcherService } from './services/game-data-fetcher.service'
import { GameService } from './services/game.service'
import { GameCreateService } from './services/game-create.service'
import { GameDownloadSourceService } from './services/game-download-resource.service'
import { B2Module } from '../b2/b2.module'
import { GameEditService } from './services/game-edit.service'
import { GameEditController } from './controllers/game-edit.controller'

@Module({
  controllers: [GameCreateController, GameController, GameEditController],
  imports: [B2Module],
  providers: [
    GameDataFetcherService,
    GameService,
    GameController,
    GameCreateService,
    GameDownloadSourceService,
    GameEditService,
  ],
})
export class GameModule {}
