import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import type { Prisma } from '@prisma/client'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { GetListReqDto } from '../dto/req/get-list.req.dto'
import { PaginatedResult } from 'src/shared/interfaces/response/response.interface'
import { DeveloperResDto } from '../dto/res/developer.res.dto'

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  async getList(dto: GetListReqDto): Promise<PaginatedResult<DeveloperResDto>> {
    const { page, pageSize, q } = dto

    let aliasLikeIds: number[] = []
    if (q && q.length > 0) {
      const ids = await this.prisma.$queryRaw<Array<{ id: number }>>`
        select id
          from game_developers
          where exists (
            select 1 from unnest(aliases) as alias
            where alias ilike ${'%' + q + '%'}
          )
        `
      aliasLikeIds = ids.map(r => r.id)
    }

    const where: Prisma.GameDeveloperWhereInput = {
      name: { not: '' },
    }
    if (q && q.length > 0) {
      const or: Prisma.GameDeveloperWhereInput[] = [{ name: { contains: q, mode: 'insensitive' } }]
      if (aliasLikeIds.length > 0) {
        or.push({ id: { in: aliasLikeIds } })
      }
      where.OR = or
    }

    const [total, developers] = await this.prisma.$transaction([
      this.prisma.gameDeveloper.count({ where }),
      this.prisma.gameDeveloper.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        select: {
          id: true,
          name: true,
          aliases: true,
          logo: true,
          _count: { select: { games: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ])
    return {
      items: developers.map(developer => ({
        id: developer.id,
        name: developer.name,
        aliases: developer.aliases,
        logo: developer.logo,
        works_count: developer._count.games,
      })),
      meta: {
        totalItems: total,
        itemCount: developers.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }

  async getById(id: number) {
    const exist = await this.prisma.gameDeveloper.findUnique({
      where: { id },
    })
    if (!exist) {
      throw new ShionBizException(ShionBizCode.GAME_DEVELOPER_NOT_FOUND)
    }

    return await this.prisma.gameDeveloper.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        aliases: true,
        logo: true,
        intro_jp: true,
        intro_zh: true,
        intro_en: true,
        website: true,
        extra_info: true,
        parent_developer: {
          select: {
            id: true,
            name: true,
            aliases: true,
          },
        },
      },
    })
  }
}
