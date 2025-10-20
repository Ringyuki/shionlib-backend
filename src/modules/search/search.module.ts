import { Global, Module } from '@nestjs/common'
import { ShionConfigService } from '../../common/config/services/config.service'
import { SEARCH_ENGINE, SearchEngine } from './interfaces/search.interface'
import { PgSearchEngine } from './engines/pg.engine'
import { MeilisearchEngine } from './engines/meilisearch.engine'
import { SearchService } from './services/search.service'
import { SearchController } from './controllers/search.controller'
import { PrismaService } from '../../prisma.service'
import { MeilisearchService } from './services/meilisearch.service'
import { SearchAnalyticsTask } from './tasks/analytics.task'
import { SearchAnalyticsService } from './services/analytics.service'
import { SearchAnalyticsProcessor } from './queues/analytics.processor'
import { RedisService } from './services/redis.service'
import { BullModule } from '@nestjs/bull'
import { SEARCH_ANALYTICS_QUEUE } from './constants/analytics'

@Global()
@Module({
  imports: [BullModule.registerQueue({ name: SEARCH_ANALYTICS_QUEUE })],
  controllers: [SearchController],
  providers: [
    {
      provide: SEARCH_ENGINE,
      inject: [ShionConfigService, PrismaService, MeilisearchService],
      useFactory: (
        config: ShionConfigService,
        prisma: PrismaService,
        meili: MeilisearchService,
      ): SearchEngine => {
        const engine = config.get('search.engine')
        switch (engine) {
          case 'pg':
            return new PgSearchEngine(prisma)
          case 'meilisearch':
            return new MeilisearchEngine(meili, config)
          default:
            throw new Error(`Unsupported search engine: ${engine}`)
        }
      },
    },
    SearchService,
    MeilisearchService,
    SearchAnalyticsTask,
    RedisService,
    SearchAnalyticsService,
    SearchAnalyticsProcessor,
  ],
  exports: [SEARCH_ENGINE],
})
export class SearchModule {}
