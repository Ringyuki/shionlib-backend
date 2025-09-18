import { IsOptional, IsNumber } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'
import { Type } from 'class-transformer'

export class GetGameListReqDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'page' }) },
  )
  @IsOptional()
  @Type(() => Number)
  page?: number = 1

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'pageSize' }) },
  )
  @IsOptional()
  @Type(() => Number)
  pageSize?: number = 10
}
