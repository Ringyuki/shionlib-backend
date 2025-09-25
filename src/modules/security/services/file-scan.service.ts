import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import NodeClam from 'clamscan'

@Injectable()
export class FileScanService implements OnModuleInit {
  private clam: NodeClam
  private readonly logger = new Logger(FileScanService.name)
  constructor(private readonly prismaService: PrismaService) {}

  async onModuleInit() {
    try {
      this.clam = await new NodeClam().init({
        clamscan: {
          path: '/opt/homebrew/opt/clamav/bin/clamscan', // Path to clamscan binary on your server
          db: '/opt/homebrew/var/lib/clamav', // Path to a custom virus definition database
          scanArchives: true, // If true, scan archives (ex. zip, rar, tar, dmg, iso, etc...)
          active: true, // If true, this module will consider using the clamscan binary
        },
        preference: 'clamscan', // If clamdscan is found and active, it will be used by default
      })
      this.logger.log('Clam initialized successfully')
    } catch (error) {
      this.logger.error(error)
    }
  }

  async scanFile(filePath: string): Promise<{ file: string; isInfected: boolean }> {
    const result = await this.clam.scanFile(filePath)
    return result
  }
}
