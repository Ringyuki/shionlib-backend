import { HttpStatus, Injectable } from '@nestjs/common'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { PrismaService } from '../../../prisma.service'
import argon2 from 'argon2'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { getPreferredLang } from '../helpers/user-language-preference-getter.helper'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'
import { CreateUserResDto } from '../dto/res/CreateUser.res.dto'
import { LoginDto } from '../dto/req/Login.req.dto'
import { LoginResDto } from '../dto/res/Login.res.dto'
import { UserStatus } from '../../../shared/enums/auth/user-status.enum'
import { verifyPassword } from '../utils/verify-password.util'
import { LoginSessionService } from '../../auth/services/login-session.service'
import { VerificationCodeService } from '../../auth/services/vrification-code.service'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ShionConfigService,
    private readonly loginSessionService: LoginSessionService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}
  async create(user: CreateUserDto, request: RequestWithUser): Promise<CreateUserResDto> {
    const { code, uuid } = user
    const { verified } = await this.verificationCodeService.verify({
      uuid,
      code,
      email: user.email,
    })
    if (!verified) {
      throw new ShionBizException(
        ShionBizCode.AUTH_VERIFICATION_CODE_ERROR,
        'shion-biz.AUTH_VERIFICATION_CODE_ERROR',
      )
    }

    const lang = user.lang || getPreferredLang(request.headers['accept-language'])

    if (!this.configService.get('allowRegister')) {
      throw new ShionBizException(
        ShionBizCode.USER_NOT_ALLOW_REGISTER,
        'shion-biz.USER_NOT_ALLOW_REGISTER',
      )
    }
    if (await this.prisma.user.findUnique({ where: { email: user.email } })) {
      throw new ShionBizException(
        ShionBizCode.USER_EMAIL_ALREADY_EXISTS,
        'shion-biz.USER_EMAIL_ALREADY_EXISTS',
      )
    }
    if (await this.prisma.user.findUnique({ where: { name: user.name } })) {
      throw new ShionBizException(
        ShionBizCode.USER_NAME_ALREADY_EXISTS,
        'shion-biz.USER_NAME_ALREADY_EXISTS',
      )
    }

    const { name, email, password } = user
    const passwordHash = await argon2.hash(password)

    const createdUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: passwordHash,
        lang,
        upload_quota: {
          create: {
            size: 0n,
            used: 0n,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created: true,
      },
    })
    return createdUser
  }

  async login(user: LoginDto, req: RequestWithUser): Promise<LoginResDto> {
    const { identifier, password } = user
    const ip = req.ip
    const user_agent = req.headers['user-agent']
    const device = { ip, user_agent }

    const foundUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: { equals: identifier, mode: 'insensitive' } },
          { name: { equals: identifier, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        password: true,
        email: true,
        avatar: true,
        cover: true,
        role: true,
        lang: true,
        content_limit: true,
        status: true,
      },
    })

    if (!foundUser) {
      throw new ShionBizException(
        ShionBizCode.USER_NOT_FOUND,
        'shion-biz.USER_NOT_FOUND',
        undefined,
        HttpStatus.NOT_FOUND,
      )
    }
    if (foundUser.status === UserStatus.BANNED) {
      throw new ShionBizException(ShionBizCode.USER_BANNED, 'shion-biz.USER_BANNED')
    }

    const isPasswordValid = await verifyPassword(password, foundUser.password)
    if (!isPasswordValid) {
      throw new ShionBizException(
        ShionBizCode.USER_INVALID_PASSWORD,
        'shion-biz.USER_INVALID_PASSWORD',
        undefined,
        HttpStatus.UNAUTHORIZED,
      )
    }

    const { token, refreshToken: refresh_token } = await this.loginSessionService.issueOnLogin(
      foundUser.id,
      device,
      foundUser.role,
      foundUser.content_limit,
    )

    return {
      token,
      refresh_token,
    }
  }

  async refreshToken(refresh_token: string, req: RequestWithUser) {
    if (!refresh_token) {
      throw new ShionBizException(
        ShionBizCode.AUTH_INVALID_REFRESH_TOKEN,
        'shion-biz.AUTH_INVALID_REFRESH_TOKEN',
        undefined,
        HttpStatus.UNAUTHORIZED,
      )
    }
    const ip = req.ip
    const user_agent = req.headers['user-agent']
    const device = { ip, user_agent }

    const { token: new_token, refreshToken: new_refresh_token } =
      await this.loginSessionService.refresh(refresh_token, device)

    return {
      token: new_token,
      refresh_token: new_refresh_token,
    }
  }

  async getMe(req: RequestWithUser) {
    const user = await this.prisma.user.findUnique({
      where: { id: req.user.sub },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        cover: true,
        role: true,
        lang: true,
        content_limit: true,
      },
    })

    if (!user) {
      throw new ShionBizException(ShionBizCode.USER_NOT_FOUND, 'shion-biz.USER_NOT_FOUND')
    }

    return user
  }

  async checkName(name: string) {
    const exists = await this.prisma.user.findUnique({ where: { name } })
    return {
      exists: !!exists,
    }
  }
}
