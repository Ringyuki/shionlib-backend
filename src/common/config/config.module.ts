import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ShionConfigService } from './services/config.service'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  providers: [ShionConfigService],
  exports: [ShionConfigService],
})
export class ShionConfigModule {}
