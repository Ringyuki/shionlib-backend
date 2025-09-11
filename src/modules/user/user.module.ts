import { Module } from '@nestjs/common'
import { UserController } from './controllers/user.controller'
import { UserService } from './services/user.service'
import { LoginSessionService } from '../auth/services/login-session.service'
import { TokenService } from '../auth/services/token.service'

@Module({
  controllers: [UserController],
  providers: [UserService, LoginSessionService, TokenService],
})
export class UserModule {}
