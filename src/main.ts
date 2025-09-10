import { NestFactory, Reflector } from '@nestjs/core'
import { ConfigService } from '@nestjs/config'
import { NestExpressApplication } from '@nestjs/platform-express'
import { I18nService } from 'nestjs-i18n'
import { AppModule } from './app.module'
import { requestId } from './common/middlewares/request-id.middleware'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor'
import { ValidationPipe } from '@nestjs/common'
import { ShionBizException } from './shared/exceptions/shion-business.exception'
import { ShionBizCode } from './shared/enums/biz-code/shion-biz-code.enum'
import { flattenValidationErrors } from './common/validation/flatten-validation.util'
import { HttpStatus } from '@nestjs/common'

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
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      exceptionFactory: errors =>
        new ShionBizException(
          ShionBizCode.COMMON_VALIDATION_FAILED,
          'shion-biz.COMMON_VALIDATION_FAILED',
          { errors: flattenValidationErrors(errors) },
          HttpStatus.BAD_REQUEST,
        ),
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
