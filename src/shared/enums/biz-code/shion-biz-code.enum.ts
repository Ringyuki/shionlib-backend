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

  // 30
  USER_NOT_FOUND = 300101,
  USER_EMAIL_ALREADY_EXISTS = 300102,
  USER_NAME_ALREADY_EXISTS = 300103,
  USER_NOT_ALLOW_REGISTER = 300104,
  USER_BANNED = 300105,
  USER_INVALID_PASSWORD = 300106,

  // 40
  GAME_NOT_FOUND = 400101,

  // 41
  GAME_DEVELOPER_NOT_FOUND = 410101,

  // 42
  GAME_CHARACTER_NOT_FOUND = 420101,

  // 43
  GAME_RESOURCE_NOT_FOUND = 430101,

  // 44
  FAVORITE_ALREADY_EXISTS = 440101,

  // 45
  COMMENT_NOT_FOUND = 450101,
}
