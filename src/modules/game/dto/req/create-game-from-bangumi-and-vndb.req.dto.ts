import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'

export class CreateGameFromBangumiAndVNDBReqDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'b_id' }) },
  )
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'b_id' }) })
  b_id: number

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'v_id' }) },
  )
  @IsOptional()
  v_id?: number
}
