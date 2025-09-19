import { IsEmail, IsOptional, IsString } from 'class-validator'

export class SendEmailDto {
  @IsString()
  subject: string

  @IsEmail()
  to: string

  @IsString()
  bodyHtml: string

  @IsEmail()
  @IsOptional()
  from?: string
}
