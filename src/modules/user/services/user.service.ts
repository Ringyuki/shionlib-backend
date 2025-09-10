import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { CreateUserDto } from '../dto/req/CreateUser.req.dto'
import { CreateUserResDto } from '../dto/res/CreateUser.res.dto'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async createUser(user: CreateUserDto): Promise<CreateUserResDto> {
    const createdUser = await this.prisma.user.create({
      data: user,
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
}
