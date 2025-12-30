import { Injectable, OnModuleInit, Logger } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import NodeClam from 'clamscan'
import { ShionConfigService } from '../../../common/config/services/config.service'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { ArchiveStatus } from '../enums/archive-status.enum'
import { Queue } from 'bull'
import { InjectQueue } from '@nestjs/bull'
import { LARGE_FILE_UPLOAD_QUEUE, S3_UPLOAD_JOB } from '../../upload/constants/upload.constants'
import { UploadQuotaService } from '../../upload/services/upload-quota.service'
import { ActivityService } from '../../activity/services/activity.service'
import {
  ActivityType,
  ActivityFileStatus,
  ActivityFileCheckStatus,
} from '../../activity/dto/create-activity.dto'
import { UserService } from '../../user/services/user.service'
import { MessageService } from '../../message/services/message.service'
import { MessageType } from '../../message/dto/req/send-message.req.dto'
import { FILE_CHECK_STATUS_MAP } from '../../upload/constants/upload.constants'

@Injectable()
export class FileScanService implements OnModuleInit {
  private clam: NodeClam
  private readonly logger = new Logger(FileScanService.name)
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ShionConfigService,
    @InjectQueue(LARGE_FILE_UPLOAD_QUEUE) private readonly uploadQueue: Queue,
    private readonly uploadQuotaService: UploadQuotaService,
    private readonly activityService: ActivityService,
    private readonly userService: UserService,
    private readonly messageService: MessageService,
  ) {}

  async onModuleInit() {
    if (
      !this.configService.get('file_scan.clamscan_binary_path') ||
      !this.configService.get('file_scan.clamscan_db_path')
    ) {
      throw new Error('Clamscan binary path or database path is not set')
    }

    try {
      this.clam = await new NodeClam().init({
        clamdscan: { active: false },
        clamscan: {
          path: this.configService.get('file_scan.clamscan_binary_path'),
          db: this.configService.get('file_scan.clamscan_db_path'),
          scanArchives: true,
          active: true,
        },
        preference: 'clamscan',
      })
      this.logger.log('Clam initialized successfully')
    } catch (error) {
      this.logger.error(error)
      throw error
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
        creator_id: true,
        upload_session_id: true,
      },
    })
    for (const file of allFiles) {
      await this.scanFile(file.file_path!, file.creator_id, file.upload_session_id!)
    }

    return allFiles.length
  }

  private async scanFile(filePath: string, creator_id: number, upload_session_id: number) {
    const file = await this.prismaService.gameDownloadResourceFile.findUnique({
      where: { file_path: filePath },
      select: {
        id: true,
        file_size: true,
        file_name: true,
        game_download_resource: {
          select: {
            game_id: true,
          },
        },
      },
    })
    if (!file) {
      this.logger.warn(`file ${filePath} not found, skip`)
      return
    }
    this.logger.log(`scanning file ${filePath}`)
    const status = await this.inspectArchive(filePath)
    const gameId = file.game_download_resource.game_id
    const meta = {
      file_id: file.id,
      file_name: file.file_name,
      file_size: Number(file.file_size),
    }

    if (status !== ArchiveStatus.OK) {
      await this.prismaService.gameDownloadResourceFile.update({
        where: { file_path: filePath },
        data: { file_check_status: status },
      })
      await this.uploadQuotaService.withdrawUploadQuotaUseAdjustment(creator_id, upload_session_id)
      const activityType =
        status === ArchiveStatus.BROKEN_OR_TRUNCATED
          ? ActivityType.FILE_CHECK_BROKEN_OR_TRUNCATED
          : status === ArchiveStatus.BROKEN_OR_UNSUPPORTED
            ? ActivityType.FILE_CHECK_BROKEN_OR_UNSUPPORTED
            : ActivityType.FILE_CHECK_ENCRYPTED
      const activityCheckStatus =
        status === ArchiveStatus.BROKEN_OR_TRUNCATED
          ? ActivityFileCheckStatus.BROKEN_OR_TRUNCATED
          : status === ArchiveStatus.BROKEN_OR_UNSUPPORTED
            ? ActivityFileCheckStatus.BROKEN_OR_UNSUPPORTED
            : ActivityFileCheckStatus.ENCRYPTED
      await this.activityService.create({
        type: activityType,
        user_id: creator_id,
        game_id: gameId,
        file_id: file.id,
        file_status: ActivityFileStatus.UPLOADED_TO_SERVER,
        file_check_status: activityCheckStatus,
        file_size: Number(file.file_size),
        file_name: file.file_name,
      })
      await this.messageService.send({
        type: MessageType.SYSTEM,
        title: 'Messages.System.File.Upload.FileUploadFailedTitle',
        content: 'Messages.System.File.Upload.FileCheckFailedContent',
        game_id: gameId,
        meta: {
          ...meta,
          file_check_status: status,
          reason: FILE_CHECK_STATUS_MAP[status],
        },
        receiver_id: creator_id,
      })
      this.logger.warn(`file ${filePath} is not ok, reason: ${status}`)
      return
    }
    const result = await this.clam.scanFile(filePath)
    if (result.isInfected) {
      await this.prismaService.$transaction(async tx => {
        await tx.gameDownloadResourceFile.update({
          where: { file_path: filePath },
          data: { file_check_status: ArchiveStatus.HARMFUL },
        })
        await this.activityService.create(
          {
            type: ActivityType.FILE_CHECK_HARMFUL,
            user_id: creator_id,
            game_id: gameId,
            file_id: file.id,
            file_status: ActivityFileStatus.UPLOADED_TO_SERVER,
            file_check_status: ActivityFileCheckStatus.HARMFUL,
            file_size: Number(file.file_size),
            file_name: file.file_name,
          },
          tx,
        )
        await this.messageService.send(
          {
            type: MessageType.SYSTEM,
            title: 'Messages.System.File.Upload.FileUploadFailedTitle',
            content: 'Messages.System.File.Upload.FileHarmfulContent',
            game_id: gameId,
            meta: {
              ...meta,
              file_check_status: ArchiveStatus.HARMFUL,
              reason: FILE_CHECK_STATUS_MAP[ArchiveStatus.HARMFUL],
            },
            receiver_id: creator_id,
          },
          tx,
        )
        const user = await tx.user.update({
          where: { id: creator_id },
          data: { upload_injected_file_times: { increment: 1 } },
          select: { upload_injected_file_times: true },
        })
        if (user.upload_injected_file_times === 3) {
          await this.userService.ban(
            creator_id,
            {
              banned_reason: 'Uploaded harmful file (3 times)',
              banned_duration_days: 30,
            },
            tx,
          )
        } else if (user.upload_injected_file_times === 5) {
          await this.userService.ban(
            creator_id,
            {
              banned_reason: 'Uploaded harmful file (5 times)',
              is_permanent: true,
            },
            tx,
          )
        }
      })
      this.logger.warn(`file ${filePath} is not ok, reason: ${result}`)
      return
    }
    await this.prismaService.gameDownloadResourceFile.update({
      where: { file_path: filePath },
      data: { file_check_status: ArchiveStatus.OK },
    })
    await this.uploadQueue.add(
      S3_UPLOAD_JOB,
      {
        resourceFileId: file.id,
      },
      {
        jobId: `s3-upload:${file.id.toString()}`,
        attempts: 5,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: true,
      },
    )
    await this.activityService.create({
      type: ActivityType.FILE_CHECK_OK,
      game_id: gameId,
      user_id: creator_id,
      file_id: file.id,
      file_status: ActivityFileStatus.UPLOADED_TO_SERVER,
      file_check_status: ActivityFileCheckStatus.OK,
      file_size: Number(file.file_size),
      file_name: file.file_name,
    })
  }

  private async inspectArchive(filePath: string) {
    const execFileAsync = promisify(execFile)
    const execOptsList = { timeout: 30_000, maxBuffer: 64 * 1024 * 1024 }
    const execOptsTest = { timeout: 10 * 60_000, maxBuffer: 64 * 1024 * 1024 }

    let listStdout = ''
    let listStderr = ''
    let status = ArchiveStatus.OK

    try {
      const { stdout, stderr } = await execFileAsync(
        '7zz',
        ['l', '-slt', '-p-', filePath],
        execOptsList,
      )
      listStdout = stdout || ''
      listStderr = stderr || ''
    } catch (error: any) {
      listStdout = error?.stdout || ''
      listStderr = error?.stderr || ''
      const blob = (listStdout + '\n' + listStderr + '\n' + (error?.message || '')).trim()
      // do a quick check first
      if (/Wrong password|Can not open encrypted archive|Can not decrypt/i.test(blob)) {
        return ArchiveStatus.ENCRYPTED
      }
      if (
        /Headers Error|Data Error|Unexpected end of (?:file|data)|CRC Failed|Data is corrupted|Can not open file as archive/i.test(
          blob,
        )
      ) {
        return ArchiveStatus.BROKEN_OR_TRUNCATED
      }
      return ArchiveStatus.BROKEN_OR_UNSUPPORTED
    }

    const stdoutToInspect = listStdout || ''

    // multi-volume & headers error → corrupted
    const isRar = /\bType\s*=\s*Rar/i.test(stdoutToInspect)
    const multivolumeFlag = /\bMultivolume\s*=\s*\+/i.test(stdoutToInspect)
    const volumesMatch = stdoutToInspect.match(/\bVolumes\s*=\s*(\d+)/i)
    const volumesGt1 = volumesMatch ? Number(volumesMatch[1]) > 1 : false
    const isMultiVolume = multivolumeFlag || volumesGt1

    const hasHeadersError =
      /Headers Error/i.test(stdoutToInspect) || /Headers Error/i.test(listStderr)

    if (isRar && isMultiVolume && hasHeadersError) {
      return ArchiveStatus.BROKEN_OR_TRUNCATED
    }

    // encrypted → return
    const encrypted =
      /\bEncrypted\s*=\s*\+/.test(stdoutToInspect) || /\bMethod\s*=\s*AES/i.test(stdoutToInspect)
    if (encrypted) {
      return ArchiveStatus.ENCRYPTED
    }

    // t stage (don't pass -p-; reduce noise)
    try {
      const { stdout: testOut } = await execFileAsync(
        '7zz',
        ['t', '-bb0', '-bd', '-y', '-p-', filePath],
        execOptsTest,
      )
      if (
        /Headers Error|Data Error|Unexpected end of (?:file|data)|CRC Failed|Data is corrupted/i.test(
          testOut,
        )
      ) {
        status = ArchiveStatus.BROKEN_OR_TRUNCATED
      } else {
        // no critical error → keep OK
        status = ArchiveStatus.OK
      }
    } catch (error: any) {
      const testOut: string = error?.stdout || ''
      const testErr: string = error?.stderr || ''
      const msg: string = error?.message || ''
      const blob = `${testOut}\n${testErr}\n${msg}`

      const hasCritical =
        /Headers Error|Data Error|Unexpected end of (?:file|data)|CRC Failed|Data is corrupted|Can not open file as archive/i.test(
          blob,
        )
      const hasUnsupported =
        /Unsupported Method|Method not supported/i.test(testOut) ||
        /Unsupported Method|Method not supported/i.test(testErr)

      const wrongPwd = /Wrong password|Can not open encrypted archive|Can not decrypt/i.test(blob)

      const looksBuffer = /maxBuffer|stdout maxBuffer exceeded/i.test(blob)
      const looksTimeout = error?.killed || /ETIMEDOUT|timeout/i.test(blob)
      const exitCode: number | undefined = typeof error?.code === 'number' ? error.code : undefined

      if (wrongPwd) {
        status = ArchiveStatus.ENCRYPTED
      } else if (hasCritical) {
        status = ArchiveStatus.BROKEN_OR_TRUNCATED
      } else if (hasUnsupported) {
        // compression method not supported ≠ archive corrupted, keep OK
        status = ArchiveStatus.OK
      } else if (looksBuffer || looksTimeout || exitCode === 1) {
        // host side problem/Warnings, just ignore
        status = ArchiveStatus.OK
      } else {
        status = ArchiveStatus.BROKEN_OR_UNSUPPORTED
      }
    }

    return status
  }
}
