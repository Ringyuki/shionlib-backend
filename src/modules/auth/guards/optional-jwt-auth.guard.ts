import { Injectable, ExecutionContext } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'

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

  handleRequest(user: any, _info: any, context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<RequestWithUser>()
    if (user) req.user = user
    return user || null
  }
}
