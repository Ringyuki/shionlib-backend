import { HttpException, HttpStatus } from '@nestjs/common'
import { ShionBizCode } from '../../shared/enums/biz-code/shion-biz-code.enum'
import { I18nPath } from '../../generated/i18n.generated'

export class ShionBizException extends HttpException {
  constructor(
    public readonly code: ShionBizCode,
    public readonly messageKey?: I18nPath,
    public readonly args?: Record<string, any>,
    httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
  ) {
    super(messageKey ?? ShionBizCode[code], httpStatus)
  }
}
