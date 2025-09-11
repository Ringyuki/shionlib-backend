import { Controller, Post, Body, Req, Res, Get, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { LoginDto } from '../dto/req/Login.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
      `shionlib_access_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/`,
    ])

    return {
      token,
      refresh_token,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('test')
  async test(@Req() request: RequestWithUser) {
    return request.user
  }
}
