import { Module } from '@nestjs/common'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import { PrismaModule } from './prisma.module'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'
import { KeyvAdapter } from 'cache-manager'
import { AuthModule } from './modules/auth/auth.module'
import { ShionConfigModule } from './common/config/config.module'
import { ShionConfigService } from './common/config/services/config.service'
import { join } from 'path'

import { CacheUtilModule } from './modules/cache/cache-util.module'
import { UserModule } from './modules/user/user.module'
import { BangumiModule } from './modules/bangumi/bangumi.module'
import { GameModule } from './modules/game/game.module'

@Module({
  imports: [
    ShionConfigModule,
    PrismaModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ShionConfigService],
      useFactory: async (configService: ShionConfigService) => {
        const host = configService.get('redis.host')
        const port = configService.get('redis.port')
        const password = configService.get('redis.password')
        const keyPrefix = configService.get('redis.keyPrefix')
        const database = configService.get('redis.database')

        return {
          stores: [
            new KeyvAdapter(
              await redisStore({
                socket: { host, port },
                password: password || undefined,
                keyPrefix,
                database,
              }),
            ),
          ],
        }
      },
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '..', 'i18n/'),
        watch: true,
      },
      typesOutputPath: join(__dirname, '../src/generated/i18n.generated.ts'),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new CookieResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),
    CacheUtilModule,
    AuthModule,
    UserModule,
    BangumiModule,
    GameModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
