import { IsNotEmpty, IsString, IsEnum, IsArray, IsOptional, IsNumber } from 'class-validator'
import { ivm, ivmEnum } from '../../../../common/validation/i18n'

enum GameDownloadSourcePlatform {
  WINDOWS = 'win',
  IOS = 'ios',
  ANDROID = 'and',
  LINUX = 'lin',
  PS3 = 'ps3',
  PS4 = 'ps4',
  PSV = 'psv',
  PSP = 'psp',
  SWITCH = 'swi',
  DVD = 'dvd',
}

enum GameDownloadSourceLanguage {
  EN = 'en',
  ZH = 'zh',
  JP = 'jp',
}

export class CreateGameDownloadSourceReqDto {
  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'platform' }) })
  @IsEnum(GameDownloadSourcePlatform, {
    each: true,
    message: ivmEnum('validation.common.IS_ENUM', GameDownloadSourcePlatform, {
      property: 'platform',
    }),
  })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'platform' }) })
  platform: GameDownloadSourcePlatform[]

  @IsArray({ message: ivm('validation.common.IS_ARRAY', { property: 'language' }) })
  @IsEnum(GameDownloadSourceLanguage, {
    each: true,
    message: ivmEnum('validation.common.IS_ENUM', GameDownloadSourceLanguage, {
      property: 'language',
    }),
  })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'language' }) })
  language: GameDownloadSourceLanguage[]

  @IsNumber(
    { allowNaN: false, allowInfinity: false },
    { message: ivm('validation.common.IS_NUMBER', { property: 'upload_session_id' }) },
  )
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'upload_session_id' }) })
  upload_session_id: number

  @IsString({ message: ivm('validation.common.IS_STRING', { property: 'note' }) })
  @IsOptional()
  note?: string
}
