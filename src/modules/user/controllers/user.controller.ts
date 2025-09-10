import { Controller, Post, Body } from '@nestjs/common'
import { UserService } from '../services/user.service'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.createUser(createUserDto)
  }
}
