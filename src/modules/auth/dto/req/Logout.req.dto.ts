import { IsString, IsOptional } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'

export class LogoutDto {
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'token' }) })
  @IsOptional()
  token?: string
}
