import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import { PrismaModule } from './prisma.module'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'
import { KeyvAdapter } from 'cache-manager'
import { AuthModule } from './modules/auth/auth.module'
import { OptionalJwtAuthGuard } from './modules/auth/guards/optional-jwt-auth.guard'
import { ShionConfigModule } from './common/config/config.module'
import { ShionConfigService } from './common/config/services/config.service'
import { join } from 'path'

import { CacheUtilModule } from './modules/cache/cache-util.module'
import { UserModule } from './modules/user/user.module'
import { BangumiModule } from './modules/bangumi/bangumi.module'
import { VNDBModule } from './modules/vndb/vnbd.module'
import { GameModule } from './modules/game/game.module'
import { EmailModule } from './modules/email/email.module'
import { UploadModule } from './modules/upload/upload.module'
import { SecurityModule } from './modules/security/security.module'
import { ImageModule } from './modules/image/image.module'
import { ScheduleModule } from '@nestjs/schedule'
import { BullModule } from './modules/bull/bull.module'
import { S3Module } from './modules/s3/s3.module'
import { B2Module } from './modules/b2/b2.module'
import { EditModule } from './modules/edit/edit.module'
import { CommentModule } from './modules/comment/comment.module'
import { RenderModule } from './modules/render/render.module'
import { DeveloperModule } from './modules/developer/developer.module'

@Module({
  imports: [
    ShionConfigModule,
    PrismaModule,
    ScheduleModule.forRoot(),
    BullModule,
    S3Module,
    B2Module,
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
        new CookieResolver(['shionlib_locale']),
        { use: QueryResolver, options: ['lang'] },
        new AcceptLanguageResolver(),
      ],
    }),
    CacheUtilModule,
    AuthModule,
    UserModule,
    BangumiModule,
    VNDBModule,
    GameModule,
    EmailModule,
    UploadModule,
    SecurityModule,
    ImageModule,
    EditModule,
    CommentModule,
    RenderModule,
    DeveloperModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: OptionalJwtAuthGuard,
    },
  ],
})
export class AppModule {}
