import { IsNumber, IsString, MaxLength, IsOptional, IsBoolean } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'

export class BanUserReqDto {
  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'banned_by' }) },
  )
  @IsOptional()
  banned_by?: number

  @IsOptional()
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'banned_reason' }) })
  @MaxLength(255, {
    message: ivm('validation.common.MAX_LENGTH', { property: 'banned_reason', max: 255 }),
  })
  banned_reason?: string

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'banned_duration_days' }) },
  )
  @IsOptional()
  banned_duration_days?: number

  @IsOptional()
  @IsBoolean({ message: ivm('validation.common.IS_BOOLEAN', { property: 'is_permanent' }) })
  is_permanent?: boolean
}
