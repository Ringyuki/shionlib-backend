import { Controller, Post, Req, Body, Res, HttpCode } from '@nestjs/common'
import { Response } from 'express'
import { UserService } from '../../user/services/user.service'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { LogoutDto } from '../dto/req/Logout.req.dto'
import { LoginSessionService } from '../services/login-session.service'
import { ShionConfigService } from '../../../common/config/services/config.service'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly loginSessionService: LoginSessionService,
    private readonly configService: ShionConfigService,
  ) {}

  @Post('token/refresh')
  async refreshToken(
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, refresh_token } = await this.userService.refreshToken(
      request.cookies['shionlib_refresh_token'],
      request,
    )

    response.setHeader('Set-Cookie', [
      `shionlib_access_token=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${this.configService.get('token.expiresIn')}`,
      `shionlib_refresh_token=${refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${this.configService.get('refresh_token.shortWindowSec')}`,
    ])
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Body() logoutDto: LogoutDto) {
    await this.loginSessionService.logout(logoutDto.token)
  }
}
