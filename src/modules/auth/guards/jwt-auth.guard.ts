import { Injectable, ExecutionContext, HttpStatus } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { JwtService } from '@nestjs/jwt'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ShionConfigService,
  ) {
    super()
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>()
    const token = this.extractTokenFromHeader(request) || this.extractTokenFromCookie(request)
    if (!token) {
      throw new ShionBizException(
        ShionBizCode.AUTH_UNAUTHORIZED,
        'shion-biz.AUTH_UNAUTHORIZED',
        undefined,
        HttpStatus.UNAUTHORIZED,
      )
    }

    try {
      const payload = (await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      })) as RequestWithUser['user']
      request.user = payload
      return true
    } catch {
      throw new ShionBizException(
        ShionBizCode.AUTH_UNAUTHORIZED,
        'shion-biz.AUTH_UNAUTHORIZED',
        undefined,
        HttpStatus.UNAUTHORIZED,
      )
    }
  }

  private extractTokenFromHeader(request: RequestWithUser): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? []
    return type === 'Bearer' ? token : undefined
  }

  private extractTokenFromCookie(request: RequestWithUser): string | undefined {
    if (request.cookies) {
      if (request.cookies['shionlib_access_token']) {
        return request.cookies['shionlib_access_token']
      }
    }
    return undefined
  }
}
