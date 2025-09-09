import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { I18nService, I18nContext } from 'nestjs-i18n'
import { ShionBizCode } from '../../shared/enums/biz-code/shion-biz-code.enum'
import { ShionBizException } from '../../shared/exceptions/shion-business.exception'
import { ResponseInterface } from '../../shared/interfaces/response/response.interface'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const res = ctx.getResponse()
    const req = ctx.getRequest()
    const i18nCtx = I18nContext.current(req)

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let code = ShionBizCode.COMMON_VALIDATION_FAILED
    let messageKey = 'common.error'
    let args: Record<string, any> | undefined

    if (exception instanceof ShionBizException) {
      status = exception.getStatus()
      code = exception.code
      messageKey = exception.messageKey ?? `biz.${ShionBizCode[exception.code]}`
      args = exception.args
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = ShionBizCode.COMMON_VALIDATION_FAILED
      messageKey = `http.${status}`
    }

    const message = this.i18n.t(messageKey, { lang: i18nCtx?.lang, args }) as string
    const body: ResponseInterface<null> = {
      code,
      message,
      data: null,
      requestId: req.id,
      timestamp: Date.now(),
    }

    res.status(status).json(body)
  }
}
