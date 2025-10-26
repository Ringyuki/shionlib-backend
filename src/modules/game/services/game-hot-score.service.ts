import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionConfigService } from '../../../common/config/services/config.service'

@Injectable()
export class GameHotScoreService {
  private readonly logger = new Logger(GameHotScoreService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ShionConfigService,
  ) {}

  async refreshScore() {
    const halfLifeReleaseDays = this.configService.get('game.hot_score.half_life_release_days')
    const halfLifeCreatedDays = this.configService.get('game.hot_score.half_life_created_days')
    const weightViews = this.configService.get('game.hot_score.weight_views')
    const weightDownloads = this.configService.get('game.hot_score.weight_downloads')
    const weightRelease = this.configService.get('game.hot_score.weight_release')
    const weightCreated = this.configService.get('game.hot_score.weight_created')

    const sql = `
      WITH base AS (
        SELECT
          g.id,
          (
            ${weightViews}     * LN(g.views + 1) +
            ${weightDownloads} * LN(g.downloads + 1) +
            ${weightRelease}   * EXP(- GREATEST(0, EXTRACT(EPOCH FROM (NOW() - COALESCE(g.release_date, g.created))) / 86400.0) / ${halfLifeReleaseDays}) +
            ${weightCreated}   * EXP(- GREATEST(0, EXTRACT(EPOCH FROM (NOW() - g.created)) / 86400.0) / ${halfLifeCreatedDays})
          ) AS new_score
        FROM "games" g
        WHERE g.status = 1
          AND COALESCE(g.release_date, g.created) <= NOW()
      )
      UPDATE "games" AS g
      SET "hot_score" = b.new_score
      FROM base b
      WHERE g.id = b.id
        AND g."hot_score" IS DISTINCT FROM b.new_score;
    `
    const started = Date.now()
    const result = await this.prisma.$executeRawUnsafe(sql)
    this.logger.log(`hot_score refreshed: affected=${result}, costMs=${Date.now() - started}`)
  }
}
