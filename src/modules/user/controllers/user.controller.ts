import { Controller, Post, Body, Req, Res, Get, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { LoginDto } from '../dto/req/Login.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { ShionConfigService } from '../../../common/config/services/config.service'

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ShionConfigService,
  ) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() request: RequestWithUser) {
    return await this.userService.create(createUserDto, request)
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Req() request: RequestWithUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, refresh_token } = await this.userService.login(loginDto, request)

    response.setHeader('Set-Cookie', [
      `shionlib_access_token=${token}; HttpOnly; ${this.configService.get('environment') === 'production' ? 'Secure' : ''} ; SameSite=Lax; Path=/; Max-Age=${this.configService.get('token.expiresIn')}`,
      `shionlib_refresh_token=${refresh_token}; HttpOnly; ${this.configService.get('environment') === 'production' ? 'Secure' : ''}; SameSite=Lax; Path=/; Max-Age=${this.configService.get('refresh_token.shortWindowSec')}`,
    ])
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Req() request: RequestWithUser) {
    return await this.userService.getMe(request)
  }

  @Post('check-name')
  async checkName(@Body() body: { name: string }) {
    return await this.userService.checkName(body.name)
  }
}
