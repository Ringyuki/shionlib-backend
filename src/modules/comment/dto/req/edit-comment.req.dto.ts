import { IsJSON, IsNotEmpty } from 'class-validator'
import { ivm } from '../../../../common/validation/i18n'

export class EditCommentReqDto {
  @IsJSON({ message: ivm('validation.common.IS_JSON', { property: 'content' }) })
  @IsNotEmpty({ message: ivm('validation.common.IS_NOT_EMPTY', { property: 'content' }) })
  content: string
}
