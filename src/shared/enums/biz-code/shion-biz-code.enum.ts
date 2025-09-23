/**
 * shion-biz-code convention
 */

/**
 * naming convention
 * use SNAKE_CASE：`<module>*<subdomain?>\_<semantic>`
 * example：COMMON_SUCCESS、COMMON_VALIDATION_FAILED、AUTH_UNAUTHORIZED、USER_NOT_FOUND、GAME_RESOURCE_NOT_FOUND、COMMENT_FORBIDDEN
 */

/**
 * coding convention
 * `SS MMM EE`，where SS is the module segment, MMM is the submodule, and EE is the sequence number
 * SS（domain or major module）：two digits, see the table below for the module segment
 * MMM（submodule）：two/three digits, 00 is general, 01+ is subdomain or scenario
 * EE（sequence number）：two digits, 01–99
 * example：100101、200101、300101、400101、410101、420101、430101、440101、450101
 */

/**
 * module segmentation
 * 10 COMMON：general/validation/rate limiting/third-party dependencies etc.
 * 20 AUTH：authentication/authorization (login/token/permission)
 * 30 USER：user
 * 40 GAME：game
 * 41 GAME_DEVELOPER：developer
 * 42 GAME_CHARACTER：character
 * 43 GAME_RESOURCE：download resource/resource file
 * 44 FAVORITE：favorite relation
 * 45 COMMENT：comment
 */

export enum ShionBizCode {
  COMMON_SUCCESS = 0,

  // 10
  COMMON_VALIDATION_FAILED = 100101,

  // 20
  AUTH_UNAUTHORIZED = 200101,
  AUTH_INVALID_TOKEN = 200102,
  AUTH_INVALID_REFRESH_TOKEN = 200103,
  AUTH_REFRESH_TOKEN_EXPIRED = 200104,
  AUTH_REFRESH_TOKEN_REUSED = 200105,
  AUTH_FAMILY_BLOCKED = 200106,
  AUTH_VERIFICATION_CODE_NOT_FOUND_OR_EXPIRED = 200107,
  AUTH_VERIFICATION_CODE_ERROR = 200108,

  // 30
  USER_NOT_FOUND = 300101,
  USER_EMAIL_ALREADY_EXISTS = 300102,
  USER_NAME_ALREADY_EXISTS = 300103,
  USER_NOT_ALLOW_REGISTER = 300104,
  USER_BANNED = 300105,
  USER_INVALID_PASSWORD = 300106,

  // 40
  GAME_NOT_FOUND = 400101,
  GAME_INVALID_VNDB_ID = 400102,
  GAME_BANGUMI_REQUEST_FAILED = 400103,
  GAME_VNDB_REQUEST_FAILED = 400104,
  GAME_ALREADY_EXISTS = 400105,
  GAME_DATA_CONSISTENCY_CHECK_FAILED = 400106,

  // 41
  GAME_DEVELOPER_NOT_FOUND = 410101,
  GAME_DEVELOPER_ALREADY_EXISTS = 410102,

  // 42
  GAME_CHARACTER_NOT_FOUND = 420101,
  GAME_CHARACTER_ALREADY_EXISTS = 420102,

  // 43
  GAME_COVER_ALREADY_EXISTS = 430101,

  // 44
  GAME_RESOURCE_NOT_FOUND = 440101,

  // 45
  FAVORITE_ALREADY_EXISTS = 450101,

  // 46
  COMMENT_NOT_FOUND = 460101,
}
