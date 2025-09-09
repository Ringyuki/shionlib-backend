import { Request } from 'express'

export interface RequestWithUser extends Request {
  user: {
    id: number
    name: string
    role: number
    status: number
    email: string
  }
}
