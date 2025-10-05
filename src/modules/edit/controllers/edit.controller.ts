import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { DataService } from '../services/data.service'

@UseGuards(JwtAuthGuard)
@Controller('edit/game')
export class EditController {
  constructor(private readonly dataService: DataService) {}

  @Get(':id/scalar')
  async getGameScalar(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameScalar(id)
  }

  @Get(':id/cover')
  async getGameCover(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameCover(id)
  }

  @Get(':id/image')
  async getGameImage(@Param('id', ParseIntPipe) id: number) {
    return this.dataService.getGameImage(id)
  }
}
