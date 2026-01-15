import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { StatsOverview, StatsTrend, TopGame } from '../interfaces/admin-stats.interface'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const CACHE_KEY_OVERVIEW = 'admin:stats:overview'
const CACHE_KEY_TRENDS = 'admin:stats:trends'
const CACHE_KEY_TOP_GAMES = 'admin:stats:top-games'
const UTC8_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

const getUtc8StartOfDay = (date: Date): Date => {
  const utc8 = new Date(date.getTime() + UTC8_OFFSET_MS)
  utc8.setUTCHours(0, 0, 0, 0)
  return new Date(utc8.getTime() - UTC8_OFFSET_MS)
}

const formatUtc8Date = (date: Date): string => {
  const utc8 = new Date(date.getTime() + UTC8_OFFSET_MS)
  return utc8.toISOString().split('T')[0]
}

@Injectable()
export class AdminStatsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getOverview(): Promise<StatsOverview> {
    const cached = await this.cacheManager.get<StatsOverview>(CACHE_KEY_OVERVIEW)
    if (cached) {
      return cached
    }

    const today = getUtc8StartOfDay(new Date())

    const [
      totalGames,
      totalUsers,
      totalCharacters,
      totalDevelopers,
      totalComments,
      newGamesToday,
      newUsersToday,
      downloadsResult,
      viewsResult,
    ] = await Promise.all([
      this.prisma.game.count({ where: { status: 1 } }),
      this.prisma.user.count({ where: { status: 1 } }),
      this.prisma.gameCharacter.count(),
      this.prisma.gameDeveloper.count(),
      this.prisma.comment.count(),
      this.prisma.game.count({
        where: { status: 1, created: { gte: today } },
      }),
      this.prisma.user.count({
        where: { status: 1, created: { gte: today } },
      }),
      this.prisma.game.aggregate({
        where: { status: 1 },
        _sum: { downloads: true },
      }),
      this.prisma.game.aggregate({
        where: { status: 1 },
        _sum: { views: true },
      }),
    ])

    const result: StatsOverview = {
      totalGames,
      totalUsers,
      totalDownloads: downloadsResult._sum.downloads || 0,
      totalViews: viewsResult._sum.views || 0,
      totalCharacters,
      totalDevelopers,
      totalComments,
      newGamesToday,
      newUsersToday,
    }

    await this.cacheManager.set(CACHE_KEY_OVERVIEW, result, CACHE_TTL)

    return result
  }

  async getTrends(days: number = 30): Promise<StatsTrend[]> {
    const cacheKey = `${CACHE_KEY_TRENDS}:${days}`
    const cached = await this.cacheManager.get<StatsTrend[]>(cacheKey)
    if (cached) {
      return cached
    }

    const startDate = getUtc8StartOfDay(new Date())
    startDate.setTime(startDate.getTime() - (days - 1) * DAY_MS)

    const gamesPerDay = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT TO_CHAR(created AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM games
      WHERE created >= ${startDate} AND status = 1
      GROUP BY TO_CHAR(created AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')
      ORDER BY date ASC
    `

    const usersPerDay = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT TO_CHAR(created AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD') as date, COUNT(*) as count
      FROM users
      WHERE created >= ${startDate} AND status = 1
      GROUP BY TO_CHAR(created AT TIME ZONE 'Asia/Shanghai', 'YYYY-MM-DD')
      ORDER BY date ASC
    `

    const result: StatsTrend[] = []
    const gamesMap = new Map(gamesPerDay.map(g => [g.date, Number(g.count)]))
    const usersMap = new Map(usersPerDay.map(u => [u.date, Number(u.count)]))

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * DAY_MS)
      const dateStr = formatUtc8Date(date)

      result.push({
        date: dateStr,
        games: gamesMap.get(dateStr) || 0,
        users: usersMap.get(dateStr) || 0,
        downloads: 0, // TODO: Would need separate tracking table for daily downloads
        views: 0, // TODO: Would need separate tracking table for daily views
      })
    }

    await this.cacheManager.set(cacheKey, result, CACHE_TTL)

    return result
  }

  async getTopGames(limit: number = 10): Promise<TopGame[]> {
    const cacheKey = `${CACHE_KEY_TOP_GAMES}:${limit}`
    const cached = await this.cacheManager.get<TopGame[]>(cacheKey)
    if (cached) {
      return cached
    }

    const games = await this.prisma.game.findMany({
      where: { status: 1 },
      orderBy: { hot_score: 'desc' },
      take: limit,
      select: {
        id: true,
        title_jp: true,
        title_zh: true,
        title_en: true,
        views: true,
        downloads: true,
        hot_score: true,
        covers: {
          take: 1,
          select: { url: true },
        },
      },
    })

    const result: TopGame[] = games.map(game => ({
      id: game.id,
      title_jp: game.title_jp,
      title_zh: game.title_zh,
      title_en: game.title_en,
      cover: game.covers[0]?.url,
      views: game.views,
      downloads: game.downloads,
      hot_score: game.hot_score,
    }))

    await this.cacheManager.set(cacheKey, result, CACHE_TTL)

    return result
  }
}
