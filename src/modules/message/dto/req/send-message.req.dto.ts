import {
  IsNotEmpty,
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsBoolean,
  IsNumber,
} from 'class-validator'
import { ivm, ivmEnum } from '../../../../common/validation/i18n'

export enum MessageType {
  COMMENT_REPLY = 'COMMENT_REPLY',
  COMMENT_LIKE = 'COMMENT_LIKE',
  SYSTEM = 'SYSTEM',
}

export class SendMessageReqDto {
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'type' }) })
  @IsEnum(MessageType, {
    message: ivmEnum('validation.common.IS_ENUM', MessageType, {
      property: 'type',
    }),
  })
  type: MessageType

  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'title' }) })
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'title' }) })
  @MaxLength(255, { message: ivm('validation.common.MAX_LENGTH', { property: 'title', max: 255 }) })
  title: string

  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'content' }) })
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'content' }) })
  @MaxLength(10240, {
    message: ivm('validation.common.MAX_LENGTH', { property: 'content', max: 10240 }),
  })
  content: string

  @IsOptional()
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'link_text' }) })
  @MaxLength(255, {
    message: ivm('validation.common.MAX_LENGTH', { property: 'link_text', max: 255 }),
  })
  link_text?: string

  @IsOptional()
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'link_url' }) })
  @MaxLength(255, {
    message: ivm('validation.common.MAX_LENGTH', { property: 'link_url', max: 255 }),
  })
  link_url?: string

  @IsOptional()
  @IsBoolean({ message: ivm('validation.common.IS_BOOLEAN', { property: 'external_link' }) })
  external_link?: boolean

  @IsOptional()
  @IsNumber({}, { message: ivm('validation.common.IS_NUMBER', { property: 'comment_id' }) })
  comment_id?: number

  @IsOptional()
  @IsNumber({}, { message: ivm('validation.common.IS_NUMBER', { property: 'game_id' }) })
  game_id?: number

  @IsOptional()
  @IsNumber({}, { message: ivm('validation.common.IS_NUMBER', { property: 'sender_id' }) })
  sender_id?: number

  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'receiver_id' }) })
  @IsNumber({}, { message: ivm('validation.common.IS_NUMBER', { property: 'receiver_id' }) })
  receiver_id: number
}
