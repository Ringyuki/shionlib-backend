import { Injectable } from '@nestjs/common'
import { SearchEngine, SEARCH_ENGINE } from '../interfaces/search.interface'
import { Inject } from '@nestjs/common'
import { SearchReqDto } from '../dto/req/search.req.dto'

@Injectable()
export class SearchService {
  constructor(@Inject(SEARCH_ENGINE) private readonly searchEngine: SearchEngine) {}

  async searchGames(query: SearchReqDto) {
    return this.searchEngine.searchGames(query)
  }
}
