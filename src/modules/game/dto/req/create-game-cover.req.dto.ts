import { IsUrl, IsEnum, IsNotEmpty } from 'class-validator'
import { ivm, ivmEnum } from '../../../../common/validation/i18n'

export enum GameCoverType {
  DIG = 'dig',
  PKGFRONT = 'pkgfront',
}

export enum GameCoverLanguage {
  JP = 'jp',
  ZH = 'zh',
  EN = 'en',
}

export class CreateGameCoverReqDto {
  @IsEnum(GameCoverLanguage, {
    message: ivmEnum('validation.common.IS_ENUM', GameCoverLanguage, {
      property: 'language',
    }),
  })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'language' }) })
  language: GameCoverLanguage

  @IsEnum(GameCoverType, {
    message: ivmEnum('validation.common.IS_ENUM', GameCoverType, {
      property: 'type',
    }),
  })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'type' }) })
  type: GameCoverType

  @IsUrl({}, { message: ivm('validation.common.IS_URL', { property: 'url' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'url' }) })
  url: string
}
