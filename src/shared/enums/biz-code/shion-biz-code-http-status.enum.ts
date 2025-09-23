import { ShionBizCode } from './shion-biz-code.enum'
import { HttpStatus } from '@nestjs/common'

export const ShionBizCodeHttpStatus: Record<ShionBizCode, HttpStatus> = {
  [ShionBizCode.COMMON_SUCCESS]: HttpStatus.OK,

  // 10
  [ShionBizCode.COMMON_VALIDATION_FAILED]: HttpStatus.UNPROCESSABLE_ENTITY,

  // 20
  [ShionBizCode.AUTH_UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_INVALID_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_INVALID_REFRESH_TOKEN]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_REFRESH_TOKEN_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_REFRESH_TOKEN_REUSED]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_FAMILY_BLOCKED]: HttpStatus.FORBIDDEN,
  [ShionBizCode.AUTH_VERIFICATION_CODE_NOT_FOUND_OR_EXPIRED]: HttpStatus.UNAUTHORIZED,
  [ShionBizCode.AUTH_VERIFICATION_CODE_ERROR]: HttpStatus.UNAUTHORIZED,

  // 30
  [ShionBizCode.USER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ShionBizCode.USER_EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ShionBizCode.USER_NAME_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ShionBizCode.USER_NOT_ALLOW_REGISTER]: HttpStatus.FORBIDDEN,
  [ShionBizCode.USER_BANNED]: HttpStatus.FORBIDDEN,
  [ShionBizCode.USER_INVALID_PASSWORD]: HttpStatus.UNAUTHORIZED,

  // 40
  [ShionBizCode.GAME_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ShionBizCode.GAME_INVALID_VNDB_ID]: HttpStatus.UNPROCESSABLE_ENTITY,
  [ShionBizCode.GAME_BANGUMI_REQUEST_FAILED]: HttpStatus.BAD_GATEWAY,
  [ShionBizCode.GAME_VNDB_REQUEST_FAILED]: HttpStatus.BAD_GATEWAY,
  [ShionBizCode.GAME_ALREADY_EXISTS]: HttpStatus.CONFLICT,
  [ShionBizCode.GAME_DATA_CONSISTENCY_CHECK_FAILED]: HttpStatus.BAD_REQUEST,

  // 41
  [ShionBizCode.GAME_DEVELOPER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ShionBizCode.GAME_DEVELOPER_ALREADY_EXISTS]: HttpStatus.CONFLICT,

  // 42
  [ShionBizCode.GAME_CHARACTER_NOT_FOUND]: HttpStatus.NOT_FOUND,
  [ShionBizCode.GAME_CHARACTER_ALREADY_EXISTS]: HttpStatus.CONFLICT,

  // 43
  [ShionBizCode.GAME_COVER_ALREADY_EXISTS]: HttpStatus.CONFLICT,

  // 44
  [ShionBizCode.GAME_RESOURCE_NOT_FOUND]: HttpStatus.NOT_FOUND,

  // 45
  [ShionBizCode.FAVORITE_ALREADY_EXISTS]: HttpStatus.CONFLICT,

  // 46
  [ShionBizCode.COMMENT_NOT_FOUND]: HttpStatus.NOT_FOUND,
} as const satisfies Record<ShionBizCode, HttpStatus>
