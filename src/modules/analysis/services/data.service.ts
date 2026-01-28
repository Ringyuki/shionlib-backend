import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'

@Injectable()
export class DataService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const games = await this.prisma.game.count({
      where: {
        status: 1,
      },
    })
    const files = await this.prisma.gameDownloadResourceFile.count({
      where: {
        OR: [
          {
            file_status: 3,
            type: 1,
          },
          {
            type: 2,
          },
          {
            type: 3,
          },
        ],
      },
    })
    const resources = await this.prisma.gameDownloadResource.count({
      where: {
        game: {
          status: 1,
        },
      },
    })
    const storage = await this.prisma.gameDownloadResourceFile.aggregate({
      where: {
        file_status: 3,
        type: 1,
      },
      _sum: {
        file_size: true,
      },
    })
    const bytes_gotten = await this.prisma.gameDownloadResourceFile.aggregate({
      where: {
        file_status: 3,
        type: 1,
      },
      _sum: {
        file_size: true,
      },
    })
    return {
      games,
      files,
      resources,
      storage: Number(storage._sum.file_size) || 0,
      bytes_gotten: Number(bytes_gotten._sum.file_size) || 0,
    }
  }
}
