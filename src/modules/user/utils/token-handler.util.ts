import { JwtService } from '@nestjs/jwt'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { UserInterface } from '../interfaces/user.interface'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { TokenPayloadInterface } from '../interfaces/token-payload.interface'
import { RefreshTokenPayloadInterface } from '../interfaces/refresh-token-payload.interface'
import { randomUUID as nodeRandomUUID } from 'node:crypto'

export class TokenHandler {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ShionConfigService,
  ) {}
  async generateToken(user: UserInterface) {
    const token_payload: TokenPayloadInterface = {
      sub: user.id,
      role: user.role,
      type: 'access',
    }
    const refresh_token_payload: RefreshTokenPayloadInterface = {
      sub: user.id,
      jti: globalThis.crypto?.randomUUID?.() ?? nodeRandomUUID(),
      type: 'refresh',
    }

    const token = await this.jwtService.signAsync(token_payload, {
      expiresIn: this.configService.get('jwt.expiresIn'),
      secret: this.configService.get('jwt.secret'),
    })
    const refresh_token = await this.jwtService.signAsync(refresh_token_payload, {
      expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      secret: this.configService.get('jwt.refreshSecret'),
    })

    return { token, refresh_token }
  }

  verifyToken(token: string) {
    let decode: UserInterface
    try {
      decode = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.secret'),
      })
    } catch {
      throw new ShionBizException(ShionBizCode.AUTH_UNAUTHORIZED, 'shion-biz.AUTH_UNAUTHORIZED')
    }

    return decode
  }

  verifyRefreshToken(token: string) {
    let decode: RefreshTokenPayloadInterface
    try {
      decode = this.jwtService.verify(token, {
        secret: this.configService.get('jwt.refreshSecret'),
      })
    } catch {
      throw new ShionBizException(ShionBizCode.AUTH_UNAUTHORIZED, 'shion-biz.AUTH_UNAUTHORIZED')
    }

    return decode
  }

  async refreshToken(token_payload: TokenPayloadInterface) {
    const token = await this.jwtService.signAsync(token_payload, {
      expiresIn: this.configService.get('jwt.expiresIn'),
      secret: this.configService.get('jwt.secret'),
    })

    return token
  }
}
