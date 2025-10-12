export interface TokenPayloadInterface {
  sub: number // user id
  fid: string // family id
  sid: number // session id
  role: number
  content_limit: number
  type: 'access'
}
