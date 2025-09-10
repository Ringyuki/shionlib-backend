import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { I18nService, I18nContext, I18nValidationException } from 'nestjs-i18n'
import { I18nPath } from '../../generated/i18n.generated'
import { ShionBizCode } from '../../shared/enums/biz-code/shion-biz-code.enum'
import { ShionBizException } from '../../shared/exceptions/shion-business.exception'
import { ResponseInterface } from '../../shared/interfaces/response/response.interface'
import { formattingValidationMessage } from '../validation/formatting-validation-message.utl'
import { FieldError } from '../../shared/interfaces/response/response.interface'

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
    let messageKey: I18nPath = 'common.error'
    let args: Record<string, any> | undefined

    if (exception instanceof I18nValidationException) {
      status = HttpStatus.BAD_REQUEST
      code = ShionBizCode.COMMON_VALIDATION_FAILED
      messageKey = 'shion-biz.COMMON_VALIDATION_FAILED' as I18nPath

      const rawErrors =
        typeof (exception as any).getErrors === 'function'
          ? (exception as any).getErrors()
          : Array.isArray((exception as any).errors)
            ? (exception as any).errors
            : []

      args = {
        errors: rawErrors.map((e: any): FieldError => {
          const msgs = Object.values(e?.constraints ?? {}).map(m =>
            formattingValidationMessage(m, this.i18n, i18nCtx?.lang),
          )
          return { field: e?.property ?? '', messages: msgs }
        }),
      }
    } else if (exception instanceof ShionBizException) {
      status = exception.getStatus()
      code = exception.code
      messageKey = exception.messageKey ?? (`shion-biz.${ShionBizCode[exception.code]}` as I18nPath)
      const rawErrors = exception.args?.errors ?? []
      args = {
        errors: rawErrors.map(
          (e: any): FieldError => ({
            field: e.field ?? '',
            messages: (e.messages ?? []).map((m: string) =>
              formattingValidationMessage(m, this.i18n, i18nCtx?.lang),
            ),
          }),
        ),
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      code = ShionBizCode.COMMON_VALIDATION_FAILED
      messageKey = `http.${status}` as I18nPath
    }

    const message = this.i18n.t(messageKey, { lang: i18nCtx?.lang, args }) as string
    const body: ResponseInterface<{ errors: FieldError[] } | null> = {
      code,
      message,
      data: code === ShionBizCode.COMMON_VALIDATION_FAILED ? { errors: args?.errors ?? [] } : null,
      requestId: req.id,
      timestamp: Date.now(),
    }

    res.status(status).json(body)
  }
}
