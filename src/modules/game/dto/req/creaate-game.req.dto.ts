import { IsString, IsArray, ValidateNested, IsBoolean, IsNotEmpty } from 'class-validator'
import { Type } from 'class-transformer'
import { ivm } from '../../../../common/validation/i18n'

export class CreateGameReqDto {
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'b_id' }) })
  b_id: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'v_id' }) })
  v_id?: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'title_jp' }) })
  title_jp: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'title_zh' }) })
  title_zh: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'title_en' }) })
  title_en: string

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'aliases' }) })
  aliases: string[]

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'intro_jp' }) })
  intro_jp: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'intro_zh' }) })
  intro_zh: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'intro_en' }) })
  intro_en: string

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'images' }) })
  images: string[]

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'extra_info' }) })
  @ValidateNested({ each: true })
  @Type(() => ExtraInfo)
  extra_info: ExtraInfo[]

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'tags' }) })
  tags: string[]

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'staffs' }) })
  @ValidateNested({ each: true })
  @Type(() => Staff)
  staffs: Staff[]

  @IsBoolean({ message: ivm('validation.common.IS_BOOLEAN', { property: 'nsfw' }) })
  nsfw: boolean

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'type' }) })
  type: string

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'platform' }) })
  platform: string[]
}

class Staff {
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'name' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'name' }) })
  name: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'role' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'role' }) })
  role: string
}

class ExtraInfo {
  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'key' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'key' }) })
  key: string

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'value' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'value' }) })
  value: string
}
