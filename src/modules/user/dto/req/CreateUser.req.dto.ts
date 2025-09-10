import { IsString, IsEmail, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'

export class CreateUserDto {
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'name' }) })
  @IsNotEmpty({
    message: ivm('validation.common.IS_NOT_EMPTY', { property: 'name' }),
  })
  @MinLength(2, {
    message: ivm('validation.common.MIN_LENGTH', { property: 'name', min: 2 }),
  })
  @MaxLength(20, {
    message: ivm('validation.common.MAX_LENGTH', { property: 'name', max: 20 }),
  })
  name: string

  @IsEmail({}, { message: ivm('validation.common.IS_EMAIL', { property: 'email' }) })
  @IsNotEmpty({
    message: ivm('validation.common.IS_NOT_EMPTY', { property: 'email' }),
  })
  email: string

  @IsString({
    message: ivm('validation.common.IS_STRING', { property: 'password' }),
  })
  @IsNotEmpty({
    message: ivm('validation.common.IS_NOT_EMPTY', { property: 'password' }),
  })
  @MinLength(8, {
    message: ivm('validation.common.MIN_LENGTH', {
      property: 'password',
      min: 8,
    }),
  })
  @MaxLength(50, {
    message: ivm('validation.common.MAX_LENGTH', {
      property: 'password',
      max: 50,
    }),
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: ivm('validation.user.PASSWORD_MATCHES'),
  })
  password: string
}
