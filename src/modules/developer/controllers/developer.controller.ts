import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common'
import { DeveloperService } from '../services/developer.service'

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get(':id')
  async getDeveloper(@Param('id', ParseIntPipe) id: number) {
    return this.developerService.getDeveloper(id)
  }
}
