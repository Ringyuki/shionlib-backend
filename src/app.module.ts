import { Module } from '@nestjs/common'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import { PrismaModule } from './prisma.module'
import { ShionConfigModule } from './common/config/config.module'
import { join } from 'path'
import path from 'path'

import { UserModule } from './modules/user/user.module'

@Module({
  imports: [
    ShionConfigModule,
    PrismaModule,
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '..', 'i18n/'),
        watch: true,
      },
      typesOutputPath: path.join(__dirname, '../src/generated/i18n.generated.ts'),
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        new CookieResolver(['lang']),
        new AcceptLanguageResolver(),
      ],
    }),

    UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
