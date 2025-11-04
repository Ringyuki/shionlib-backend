import { Controller, Get, Param, ParseIntPipe, UseGuards, Query } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { DataService } from '../services/data.service'
import { PaginationReqDto } from '../../../shared/dto/req/pagination.req.dto'

@Controller('edit/game')
export class EditController {
  constructor(private readonly dataService: DataService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':id/scalar')
  async getGameScalar(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameScalar(id)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/cover')
  async getGameCover(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameCover(id)
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/image')
  async getGameImage(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameImage(id)
  }

  @Get(':id/history')
  async getGameEditHistory(@Param('id', ParseIntPipe) id: number, @Query() dto: PaginationReqDto) {
    return this.dataService.getGameEditHistory(id, dto)
  }
}
