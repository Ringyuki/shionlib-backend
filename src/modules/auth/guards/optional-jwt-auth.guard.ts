import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { TokenPayloadInterface } from '../interfaces/token-payload.interface'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'

const GUEST_USER: TokenPayloadInterface = {
  sub: 0,
  role: ShionlibUserRoles.USER,
  content_limit: 0,
  type: 'access',
}

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context)
    } catch {
      /* empty */
    }
    return true
  }

  handleRequest<T>(_err: any, user: T, _info: any, context: ExecutionContext): T {
    const req = context.switchToHttp().getRequest<RequestWithUser>()
    req.user = (user || GUEST_USER) as TokenPayloadInterface
    return req.user as T
  }
}
