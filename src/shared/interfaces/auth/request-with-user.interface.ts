import { Request } from 'express'
import { TokenPayloadInterface } from '../../../modules/auth/interfaces/token-payload.interface'

export interface RequestWithUser extends Request {
  user: TokenPayloadInterface
}
