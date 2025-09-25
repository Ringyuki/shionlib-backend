import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import NodeClam from 'clamscan'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ArchiveStatus } from '../enums/ArchiveStatus.enum'

@Injectable()
export class FileScanService implements OnModuleInit {
  private clam: NodeClam
  private readonly logger = new Logger(FileScanService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ShionConfigService,
  ) {}

  async onModuleInit() {
    try {
      this.clam = await new NodeClam().init({
        clamscan: {
          path: this.configService.get('file_scan.clamscan_binary_path'),
          db: this.configService.get('file_scan.clamscan_db_path'),
          scanArchives: true,
          active: true,
        },
      })
      this.logger.log('Clam initialized successfully')
    } catch (error) {
      this.logger.error(error)
    }
  }

  async scanFiles() {
    const allFiles = await this.prismaService.gameDownloadResourceFile.findMany({
      where: {
        type: 1,
        file_status: 2,
        file_check_status: 0,
      },
      select: {
        file_path: true,
      },
    })
    for (const file of allFiles) {
      await this.scanFile(file.file_path!)
    }

    return allFiles.length
  }

  private async scanFile(filePath: string): Promise<{ file: string; isInfected: boolean }> {
    const status = await this.inspectArchive(filePath)
    if (status !== ArchiveStatus.OK) {
      await this.prismaService.gameDownloadResourceFile.update({
        where: { file_path: filePath },
        data: { file_check_status: status },
      })
      return { file: filePath, isInfected: true }
    }
    const result = await this.clam.scanFile(filePath)
    if (result.isInfected) {
      await this.prismaService.gameDownloadResourceFile.update({
        where: { file_path: filePath },
        data: { file_check_status: ArchiveStatus.HARMFUL },
      })
    }
    await this.prismaService.gameDownloadResourceFile.update({
      where: { file_path: filePath },
      data: { file_check_status: ArchiveStatus.OK },
    })
    return result
  }

  private async inspectArchive(filePath: string) {
    const execFileAsync = promisify(execFile)
    let listStdout = ''
    let listStderr = ''
    let status = ArchiveStatus.OK

    try {
      const { stdout, stderr } = await execFileAsync('7zz', ['l', '-slt', '-p-', filePath], {
        timeout: 20_000,
      })
      listStdout = stdout || ''
      listStderr = stderr || ''
    } catch (error: any) {
      listStdout = error?.stdout || ''
      listStderr = error?.stderr || ''
    }

    const stdoutToInspect = listStdout || ''

    // check if it is a multi-volume rar file and if it has headers error
    const isRar = /\bType\s*=\s*Rar/i.test(stdoutToInspect)
    const isMultiVolume =
      /\bMultivolume\s*=\s*\+/i.test(stdoutToInspect) ||
      /\bVolumes\s*=\s*\d+/i.test(stdoutToInspect)
    const hasHeadersError =
      /Headers Error/i.test(stdoutToInspect) || /Headers Error/i.test(listStderr)

    if (isRar && isMultiVolume && hasHeadersError) {
      return ArchiveStatus.BROKEN_OR_TRUNCATED
    }

    const encrypted =
      /\bEncrypted\s*=\s*\+/.test(stdoutToInspect) || /\bMethod\s*=\s*AES/i.test(stdoutToInspect)
    if (encrypted) {
      status = ArchiveStatus.ENCRYPTED
    }

    try {
      const { stdout: testOut } = await execFileAsync('7zz', ['t', '-p-', filePath], {
        timeout: 60_000,
      })
      if (/Headers Error|Data Error|Unexpected end of file/i.test(testOut)) {
        status = ArchiveStatus.BROKEN_OR_TRUNCATED
      }
    } catch (error: any) {
      const testOut: string = error?.stdout || ''
      if (/Headers Error|Data Error|Unexpected end of file/i.test(testOut)) {
        status = ArchiveStatus.BROKEN_OR_TRUNCATED
      } else {
        status = ArchiveStatus.BROKEN_OR_UNSUPPORTED
      }
    }

    return status
  }
}
