import { Injectable } from '@nestjs/common'
import { SearchEngine } from '../interfaces/search.interface'
import { MeilisearchService } from '../services/meilisearch.service'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { IndexedGame } from '../interfaces/index.interface'
import { SearchQuery } from '../interfaces/search.interface'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import type { Index as MeiliIndex } from 'meilisearch'
import { UserContentLimit } from '../../user/interfaces/user.interface'
import { GameItemResDto } from '../dto/res/game-item.res.dto'

@Injectable()
export class MeilisearchEngine implements SearchEngine {
  constructor(
    private readonly meilisearchService: MeilisearchService,
    private readonly configService: ShionConfigService,
  ) {
    this.meilisearchService.onModuleInit()
  }

  private get indexName() {
    return this.configService.get('search.meilisearch.indexName')
  }

  private async getIndex(
    createIfNotExists: boolean = false,
  ): Promise<MeiliIndex<IndexedGame> | null> {
    const client = this.meilisearchService.getClient()
    if (!client) return null
    const index = await this.meilisearchService.ensureIndex(this.indexName, createIfNotExists)
    if (!index) return null
    return index
  }

  async upsertGame(doc: IndexedGame): Promise<void> {
    const index = await this.getIndex(true)
    if (!index) return
    await index.addDocuments([doc])
  }

  async bulkUpsertGames(docs: IndexedGame[]): Promise<void> {
    if (!docs.length) return
    const index = await this.getIndex(true)
    if (!index) return
    await index.addDocuments(docs)
  }

  async removeGame(id: number): Promise<void> {
    const index = await this.getIndex()
    if (!index) return
    await index.deleteDocument(id)
  }

  async searchGames(query: SearchQuery): Promise<PaginatedResult<GameItemResDto>> {
    const index = await this.getIndex()
    if (!index || !query.q) {
      return {
        items: [],
        meta: {
          totalItems: 0,
          itemCount: 0,
          itemsPerPage: query.pageSize,
          totalPages: 0,
          currentPage: query.page,
        },
      }
    }

    const { page, pageSize, q, content_limit } = query
    const filter: string[] = []
    if (content_limit === UserContentLimit.NEVER_SHOW_NSFW_CONTENT || !content_limit) {
      filter.push('nsfw = false')
      filter.push('max_cover_sexual = 0')
    }

    const res = await index.search(q, {
      page,
      hitsPerPage: pageSize,
      filter: filter.length ? filter : undefined,
      sort: ['release_date:desc', 'id:desc'],
      attributesToRetrieve: [
        'id',
        'title_jp',
        'title_zh',
        'title_en',
        'aliases',
        'covers',
        'developers',
        'release_date',
      ],
      attributesToHighlight: [
        'title_jp',
        'title_zh',
        'title_en',
        'intro_jp',
        'intro_zh',
        'intro_en',
        'aliases',
      ],
      highlightPreTag: '<span class="search-highlight">',
      highlightPostTag: '</span>',
    })

    const items = res.hits.map(hit => ({
      ...hit,
      developers: hit.developers?.map(developer => ({
        developer: {
          id: developer.id,
          name: developer.name,
        },
      })),
    }))
    const totalItems = res.totalHits ?? 0
    const totalPages = res.totalPages ?? (pageSize ? Math.ceil(totalItems / pageSize) : 0)

    return {
      items: items as unknown as GameItemResDto[],
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: pageSize,
        totalPages,
        currentPage: page,
      },
    }
  }

  async searchGameTags(query: string, limit?: number): Promise<string[]> {
    const index = await this.getIndex()
    const res = await index?.searchForFacetValues({
      facetName: 'tags',
      facetQuery: query,
      hitsPerPage: limit ?? 10, // not working
    })
    const hits = res?.facetHits ?? []
    const ranked = hits
      .sort((a, b) => {
        const ax = a.value === query ? 2 : a.value.startsWith(query) ? 1 : 0
        const bx = b.value === query ? 2 : b.value.startsWith(query) ? 1 : 0
        if (ax !== bx) return bx - ax
        if (a.count !== b.count) return b.count - a.count
        if (a.value.length !== b.value.length) return a.value.length - b.value.length
        return a.value.localeCompare(b.value)
      })
      .slice(0, limit ?? 10)
    return ranked.map(h => h.value)
  }
}
