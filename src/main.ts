import { NestFactory, Reflector } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { I18nService, I18nValidationPipe } from 'nestjs-i18n'
import { AppModule } from './app.module'
import { requestId } from './common/middlewares/request-id.middleware'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.disable('x-powered-by')
  app.use(requestId())
  const configService = app.get(ConfigService)

  app.enableCors({
    origin: configService.get('CORS_ORIGIN'),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
    new I18nValidationPipe({
      transform: true,
      whitelist: true,
    }),
  )

  app.useGlobalFilters(new AllExceptionsFilter(app.get(I18nService)))
  app.useGlobalInterceptors(
    new SuccessResponseInterceptor(app.get(Reflector), app.get(I18nService)),
  )

  const port = configService.get('PORT')
  await app.listen(port)
  console.log(`shionlib backend running on http://localhost:${port}`)
}
bootstrap()
