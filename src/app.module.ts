import { Module } from '@nestjs/common'
import { ShionConfigModule } from './common/config/config.module'
import { I18nModule, AcceptLanguageResolver, QueryResolver, CookieResolver } from 'nestjs-i18n'
import { join } from 'path'
import path from 'path'

@Module({
  imports: [
    ShionConfigModule,
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
