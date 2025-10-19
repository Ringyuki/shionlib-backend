import { Controller, Get, Query } from '@nestjs/common'
import { SearchService } from '../services/search.service'
import { SearchReqDto } from '../dto/req/search.req.dto'

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('games')
  async searchGames(@Query() query: SearchReqDto) {
    return this.searchService.searchGames(query)
  }
}
