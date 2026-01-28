import { Module } from '@nestjs/common'
import { AnalysisDataController } from './controllers/data.controller'
import { DataService } from './services/data.service'

@Module({
  controllers: [AnalysisDataController],
  providers: [DataService],
})
export class AnalysisModule {}
