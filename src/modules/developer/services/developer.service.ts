import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class DeveloperService {
  constructor(private readonly prisma: PrismaService) {}

  async getDeveloper(id: number) {
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
