import { IsNumber, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'
import { ivm } from '../../../common/validation/i18n'

export class PaginationReqDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'page' }) },
  )
  @IsOptional()
  @Type(() => Number)
  page: number = 1

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'pageSize' }) },
  )
  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'developer_id' }) },
  )
  @IsOptional()
  @Type(() => Number)
  developer_id?: number
}
