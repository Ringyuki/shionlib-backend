import { Controller, Post, Body, Req } from '@nestjs/common'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { LoginDto } from '../dto/req/Login.req.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto, @Req() request: RequestWithUser) {
    return await this.userService.create(createUserDto, request)
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return await this.userService.login(loginDto)
  }
}
