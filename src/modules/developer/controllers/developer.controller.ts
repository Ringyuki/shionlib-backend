import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common'
import { DeveloperService } from '../services/developer.service'
import { GetListReqDto } from '../dto/req/get-list.req.dto'

@Controller('developer')
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  @Get('list')
  async getList(@Query() dto: GetListReqDto) {
    return this.developerService.getList(dto)
  }

  @Get(':id')
  async getById(@Param('id', ParseIntPipe) id: number) {
    return this.developerService.getById(id)
  }
}
