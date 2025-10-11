import { Module } from '@nestjs/common'
import { UserController } from './controllers/user.controller'
import { UserService } from './services/user.service'
import { LoginSessionService } from '../auth/services/login-session.service'
import { TokenService } from '../auth/services/token.service'
import { AuthModule } from '../auth/auth.module'
import { VerificationCodeService } from '../auth/services/vrification-code.service'
import { UserInfoController } from './controllers/user-info.controller'
import { UserInfoService } from './services/user-info.service'

@Module({
  controllers: [UserController, UserInfoController],
  providers: [
    UserService,
    LoginSessionService,
    TokenService,
    VerificationCodeService,
    UserInfoService,
  ],
  imports: [AuthModule],
})
export class UserModule {}
