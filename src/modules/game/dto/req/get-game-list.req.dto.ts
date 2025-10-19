import { IsNumber, IsOptional } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'
import { Type } from 'class-transformer'
import { PaginationReqDto } from '../../../../shared/dto/req/pagination.req.dto'

export class GetGameListReqDto extends PaginationReqDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'developer_id' }) },
  )
  @IsOptional()
  @Type(() => Number)
  developer_id?: number
}
