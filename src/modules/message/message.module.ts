import { Global, Module } from '@nestjs/common'
import { MessageService } from './services/message.service'
import { MessageController } from './controllers/message.controller'

@Global()
@Module({
  controllers: [MessageController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule {}
