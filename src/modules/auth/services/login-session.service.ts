import { HttpStatus, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { TokenService } from './token.service'
import { ShionConfigService } from '../../../common/config/services/config.service'
import {
  generateOpaque,
  calcPrefix,
  hashOpaque,
  verifyOpaque,
  formatRefreshToken,
  parseRefreshToken,
} from '../utils/refresh-token.util'
import { DeviceSignals } from '../interfaces/device-signals.interface'
import { randomUUID as nodeRandomUUID } from 'node:crypto'
import { UserLoginSessionStatus } from '../../../shared/enums/auth/user-login-session-status.enum'
import { UserRole } from '../../../shared/enums/auth/user-role.enum'
import { UserStatus } from '../../../shared/enums/auth/user-status.enum'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class LoginSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
    private readonly configService: ShionConfigService,
  ) {}
  async issueOnLogin(userId: number, device: DeviceSignals, role: UserRole) {
    const now = new Date()
    const fid = globalThis.crypto?.randomUUID?.() ?? nodeRandomUUID()

    const opaque = generateOpaque()
    const prefix = calcPrefix(opaque)
    const hash = await hashOpaque(opaque, this.configService.get('refresh_token.pepper'))
    const refreshTokenExp = this.calcRefreshExpiry(now, now)

    const session = await this.prisma.userLoginSession.create({
      data: {
        user_id: userId,
        refresh_token_hash: hash,
        refresh_token_prefix: prefix,
        status: UserLoginSessionStatus.ACTIVE,
        expires_at: refreshTokenExp,
        last_used_at: now,
        family_id: fid,
        ip: device.ip,
        user_agent: device.user_agent,
        device_info: device.device_info,
      },
    })

    const { token, exp: tokenExp } = await this.tokenService.signToken({
      sub: userId,
      sid: session.id,
      fid,
      role,
      type: 'access',
    })

    return {
      token,
      tokenExp,
      refreshToken: formatRefreshToken(prefix, opaque),
      refreshTokenExp,
      sessionId: session.id,
      familyId: fid,
    }
  }

  async refresh(incoming: string, device: DeviceSignals) {
    const now = new Date()
    const { prefix, opaque } = parseRefreshToken(incoming)

    const outcome = await this.prisma.$transaction(async tx => {
      const old = await tx.userLoginSession.findUnique({
        where: {
          refresh_token_prefix: prefix,
        },
      })
      if (!old) {
        throw new ShionBizException(
          ShionBizCode.AUTH_INVALID_REFRESH_TOKEN,
          'shion-biz.AUTH_INVALID_REFRESH_TOKEN',
          undefined,
          HttpStatus.UNAUTHORIZED,
        )
      }

      const ok = await verifyOpaque(
        old.refresh_token_hash,
        opaque,
        this.configService.get('refresh_token.pepper'),
      )
      if (!ok) {
        throw new ShionBizException(
          ShionBizCode.AUTH_INVALID_REFRESH_TOKEN,
          'shion-biz.AUTH_INVALID_REFRESH_TOKEN',
          undefined,
          HttpStatus.UNAUTHORIZED,
        )
      }

      if (old.expires_at <= now)
        throw new ShionBizException(
          ShionBizCode.AUTH_REFRESH_TOKEN_EXPIRED,
          'shion-biz.AUTH_REFRESH_TOKEN_EXPIRED',
          undefined,
          HttpStatus.UNAUTHORIZED,
        )

      if (old.status !== UserLoginSessionStatus.ACTIVE) {
        if (old.status !== UserLoginSessionStatus.REUSED) {
          await tx.userLoginSession.update({
            where: {
              id: old.id,
            },
            data: {
              status: UserLoginSessionStatus.REUSED,
              reused_at: now,
            },
          })
        }
        await tx.userLoginSession.updateMany({
          where: {
            family_id: old.family_id,
            status: UserLoginSessionStatus.ACTIVE,
          },
          data: {
            status: UserLoginSessionStatus.BLOCKED,
            blocked_at: now,
            blocked_reason: 'refresh_token_reuse_detected',
          },
        })
        return { kind: 'reuse' as const }
      }

      const user = await tx.user.findUnique({
        where: { id: old.user_id },
        select: { id: true, role: true, status: true },
      })
      if (!user) {
        await tx.userLoginSession.updateMany({
          where: {
            family_id: old.family_id,
            status: { in: [UserLoginSessionStatus.ACTIVE, UserLoginSessionStatus.ROTATED] },
          },
          data: {
            status: UserLoginSessionStatus.BLOCKED,
            blocked_at: now,
            blocked_reason: 'user_not_found',
          },
        })
        return { kind: 'user_not_found' as const }
      }

      if (user.status === UserStatus.BANNED) {
        await tx.userLoginSession.updateMany({
          where: {
            family_id: old.family_id,
            status: { in: [UserLoginSessionStatus.ACTIVE, UserLoginSessionStatus.ROTATED] },
          },
          data: {
            status: UserLoginSessionStatus.BLOCKED,
            blocked_at: now,
            blocked_reason: 'user_banned',
          },
        })
        return { kind: 'user_banned' as const }
      }

      // TODO: handle with idempotency

      const newOpaque = generateOpaque()
      const newPrefix = calcPrefix(newOpaque)
      const newHash = await hashOpaque(newOpaque, this.configService.get('refresh_token.pepper'))
      const newRefreshTokenExp = this.calcRefreshExpiry(now, now)

      const newer = await tx.userLoginSession.create({
        data: {
          user_id: old.user_id,
          refresh_token_hash: newHash,
          refresh_token_prefix: newPrefix,
          status: UserLoginSessionStatus.ACTIVE,
          family_id: old.family_id,
          expires_at: newRefreshTokenExp,
          last_used_at: now,
          ip: device.ip,
          user_agent: device.user_agent,
          device_info: device.device_info,
        },
      })

      await tx.userLoginSession.update({
        where: {
          id: old.id,
        },
        data: {
          status: UserLoginSessionStatus.ROTATED,
          rotated_at: now,
          replaced_by_id: newer.id,
          last_used_at: now,
        },
      })

      const { token, exp: tokenExp } = await this.tokenService.signToken({
        sub: old.user_id,
        sid: newer.id,
        fid: old.family_id,
        role: user.role,
        type: 'access',
      })

      return {
        kind: 'success' as const,
        token,
        tokenExp,
        refreshToken: formatRefreshToken(newPrefix, newOpaque),
        refreshTokenExp: newRefreshTokenExp,
        sessionId: newer.id,
        familyId: newer.family_id,
      }
    })

    if (outcome && outcome.kind && outcome.kind !== 'success') {
      if (outcome.kind === 'reuse') {
        throw new ShionBizException(
          ShionBizCode.AUTH_REFRESH_TOKEN_REUSED,
          'shion-biz.AUTH_REFRESH_TOKEN_REUSED',
          undefined,
          HttpStatus.UNAUTHORIZED,
        )
      }
      if (outcome.kind === 'user_not_found') {
        throw new ShionBizException(ShionBizCode.USER_NOT_FOUND, 'shion-biz.USER_NOT_FOUND')
      }
      if (outcome.kind === 'user_banned') {
        throw new ShionBizException(
          ShionBizCode.USER_BANNED,
          'shion-biz.USER_BANNED',
          undefined,
          HttpStatus.UNAUTHORIZED,
        )
      }
    }

    return {
      token: outcome.token,
      tokenExp: outcome.tokenExp,
      refreshToken: outcome.refreshToken,
      refreshTokenExp: outcome.refreshTokenExp,
      sessionId: outcome.sessionId,
      familyId: outcome.familyId,
    }
  }

  private calcRefreshExpiry(first: Date, now: Date) {
    const short = new Date(
      now.getTime() + Number(this.configService.get('refresh_token.shortWindowSec')) * 1000,
    )
    const hard = new Date(
      first.getTime() + Number(this.configService.get('refresh_token.longWindowSec')) * 1000,
    )
    return short < hard ? short : hard
  }
}
