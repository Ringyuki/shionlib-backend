import { Controller, Post, Req, Body, Res } from '@nestjs/common'
import { Response } from 'express'
import { UserService } from '../../user/services/user.service'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { RefreshTokenDto } from '../../user/dto/req/RefreshToken.req.dto'

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('token/refresh')
  async refreshToken(
    @Req() request: RequestWithUser,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, refresh_token } = await this.userService.refreshToken(
      refreshTokenDto.refresh_token,
      request,
    )

    response.setHeader('Set-Cookie', [
      `shionlib_access_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
    ])

    return {
      token,
      refresh_token,
    }
  }
}
