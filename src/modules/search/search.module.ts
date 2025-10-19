import { Module } from '@nestjs/common'
import { ShionConfigService } from '../../common/config/services/config.service'
import { SEARCH_ENGINE, SearchEngine } from './interfaces/search.interface'
import { PgSearchEngine } from './engines/pg.engine'
import { SearchService } from './services/search.service'
import { SearchController } from './controllers/search.controller'
import { PrismaService } from '../../prisma.service'

@Module({
  controllers: [SearchController],
  providers: [
    {
      provide: SEARCH_ENGINE,
      inject: [ShionConfigService, PrismaService],
      useFactory: (config: ShionConfigService, prisma: PrismaService): SearchEngine => {
        const engine = config.get('search.engine')
        switch (engine) {
          case 'pg':
            return new PgSearchEngine(prisma)
          default:
            throw new Error(`Unsupported search engine: ${engine}`)
        }
      },
    },
    SearchService,
  ],
  exports: [SEARCH_ENGINE],
})
export class SearchModule {}
