import { HttpStatus, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
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
import { TokenHandler } from '../utils/token-handler.util'
import { TokenPayloadInterface } from '../interfaces/token-payload.interface'

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ShionConfigService,
    private readonly jwtService: JwtService,
  ) {}
  async create(user: CreateUserDto, request: RequestWithUser): Promise<CreateUserResDto> {
    const lang = getPreferredLang(request.headers['accept-language'])

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

  async login(user: LoginDto): Promise<LoginResDto> {
    const { identifier, password } = user

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

    const tokenHandler = new TokenHandler(this.jwtService, this.configService)
    const { token, refresh_token } = await tokenHandler.generateToken(foundUser)

    return {
      token,
      refresh_token,
    }
  }

  async refreshToken(refresh_token: string) {
    const tokenHandler = new TokenHandler(this.jwtService, this.configService)

    const decoded = tokenHandler.verifyRefreshToken(refresh_token)
    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        role: true,
        status: true,
      },
    })

    if (!user) {
      throw new ShionBizException(ShionBizCode.USER_NOT_FOUND, 'shion-biz.USER_NOT_FOUND')
    }
    if (user.status === UserStatus.BANNED) {
      throw new ShionBizException(ShionBizCode.USER_BANNED, 'shion-biz.USER_BANNED')
    }

    const token_payload: TokenPayloadInterface = {
      sub: user.id,
      role: user.role,
      type: 'access',
    }

    const token = await tokenHandler.refreshToken(token_payload)
    return {
      token,
    }
  }
}
