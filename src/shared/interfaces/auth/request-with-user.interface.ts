import { Request } from 'express'
import { UserInterface } from '../../../modules/user/interfaces/user.interface'

export interface RequestWithUser extends Request {
  user: UserInterface
}
