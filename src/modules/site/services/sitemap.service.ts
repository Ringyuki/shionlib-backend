import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { SiteItem } from '../types/sitemap/SiteItem'
import { SitemapType } from '../enums/sitemap/sitemap-type.enum'
import { IndexItem } from '../types/sitemap/IndexItem'
import { SiteMapReqDto } from '../dto/req/site-map.req.dto'
import { Lang } from '../../../shared/types/i18n/lang.types'

@Injectable()
export class SitemapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ShionConfigService,
  ) {}

  private get siteUrl(): string {
    return this.configService.get('siteUrl')
  }
  private readonly supportedLangs: Lang[] = ['zh', 'ja', 'en']
  private readonly defaultLang: Lang = 'en'

  async getBaseInfos(type: SitemapType, options: SiteMapReqDto): Promise<SiteItem[]> {
    const { page, pageSize } = options
    const skip = (page - 1) * pageSize

    const buildUrl = (t: SitemapType, id: number) => {
      return `${this.siteUrl}/${t}/${id}`
    }
    let items: SiteItem[] = []

    if (type === SitemapType.GAME) {
      const games = await this.prisma.game.findMany({
        where: { status: 1, nsfw: false },
        skip,
        take: pageSize,
        select: { id: true, created: true, updated: true },
      })
      items = games.map(game => ({
        url: buildUrl(type, game.id),
        lastmod: game.updated.toISOString(),
      }))
    } else if (type === SitemapType.DEVELOPER) {
      const developers = await this.prisma.gameDeveloper.findMany({
        skip,
        take: pageSize,
        select: { id: true, created: true, updated: true },
      })
      items = developers.map(developer => ({
        url: buildUrl(type, developer.id),
        lastmod: developer.updated.toISOString(),
      }))
    } else if (type === SitemapType.CHARACTER) {
      const characters = await this.prisma.gameCharacter.findMany({
        skip,
        take: pageSize,
        select: { id: true, created: true, updated: true },
      })
      items = characters.map(character => ({
        url: buildUrl(type, character.id),
        lastmod: character.updated.toISOString(),
      }))
    }
    return items
  }

  async generateIndex(): Promise<string> {
    const pageSize = 50000

    const [gameCount, developerCount, characterCount] = await Promise.all([
      this.prisma.game.count({ where: { status: 1, nsfw: false } }),
      this.prisma.gameDeveloper.count(),
      this.prisma.gameCharacter.count(),
    ])
    const sections: IndexItem[] = [
      { type: SitemapType.GAME, count: gameCount },
      { type: SitemapType.DEVELOPER, count: developerCount },
      { type: SitemapType.CHARACTER, count: characterCount },
    ]

    const now = new Date().toISOString()
    const entries: string[] = []

    for (const s of sections) {
      const totalPages = Math.ceil(s.count / pageSize)
      for (let p = 1; p <= totalPages; p++) {
        entries.push(
          `<sitemap><loc>${this.siteUrl}/sitemap-${s.type}-${p}.xml</loc><lastmod>${now}</lastmod></sitemap>`,
        )
      }
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join(
      '\n',
    )}\n</sitemapindex>`
  }

  async generateSectionSitemap(type: SitemapType, options: SiteMapReqDto): Promise<string> {
    const changefreq = 'weekly'
    const priority = type === SitemapType.GAME ? '1.0' : '0.8'

    const items = await this.getBaseInfos(type, options)
    const urls = items
      .map(i => {
        const url = i.url
        const alternates = this.supportedLangs
          .map(l => {
            return `<xhtml:link rel="alternate" hreflang="${l}" href="${this.buildUrl(url, l)}"/>`
          })
          .join('')
        const xDefault = `<xhtml:link rel="alternate" hreflang="x-default" href="${this.buildUrl(url, this.defaultLang)}"/>`
        const lastmod = `<lastmod>${i.lastmod}</lastmod>`
        return `<url><loc>${url}</loc>${alternates}${xDefault}${lastmod}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
      })
      .join('\n')

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>`
  }

  private buildUrl(originalUrl: string, lang: Lang): string {
    const base = this.siteUrl.endsWith('/') ? this.siteUrl.slice(0, -1) : this.siteUrl
    if (!originalUrl.startsWith(base + '/')) return originalUrl
    const path = originalUrl.slice((base + '/').length)
    return `${base}/${lang}/${path}`
  }
}
