import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { ShionConfigService } from '../../../common/config/services/config.service'
import * as fs from 'fs'
import * as path from 'path'

@Injectable()
export class FileCleanService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly configService: ShionConfigService,
  ) {}

  async clean() {
    const root = this.configService.get('file_upload.upload_root_dir')
    const now = Date.now()
    const graceMs = 6 * 60 * 60 * 1000 // 6h
    const orphanTtlMs = 48 * 60 * 60 * 1000 // 48h

    const sessions = await this.prismaService.gameUploadSession.findMany({
      where: {
        OR: [
          { status: 'ABORTED' },
          { status: { not: 'COMPLETED' }, expires_at: { lt: new Date(now - graceMs) } },
        ],
      },
      select: {
        id: true,
        storage_path: true,
      },
    })
    for (const s of sessions) {
      if (s.storage_path.startsWith(root)) {
        try {
          await fs.promises.rm(s.storage_path, { force: true })
        } catch {
          /* empty */
        }
      }
      if (s) {
        await this.prismaService.gameUploadSession.update({
          where: { id: s.id },
          data: { status: 'EXPIRED' },
        })
      }
    }

    const uploadedFiles = await this.prismaService.gameDownloadResourceFile.findMany({
      where: { type: 1, file_status: 3, file_path: { not: null } },
      select: { id: true, file_path: true },
    })
    for (const f of uploadedFiles) {
      if (f.file_path?.startsWith(root)) {
        try {
          await fs.promises.rm(f.file_path, { force: true })
        } catch {
          /* empty */
        }
        await this.prismaService.gameDownloadResourceFile.update({
          where: { id: f.id },
          data: { file_path: null },
        })
      }
    }

    // clean orphan files
    let entries: string[] = []
    try {
      entries = (await fs.promises.readdir(root))
        .filter(n => n.endsWith(this.configService.get('file_upload.upload_temp_file_suffix')))
        .map(n => path.join(root, n))
    } catch {
      /* empty */
    }
    if (entries.length) {
      const refs = new Set<string>()
      const [sessionsRef, filesRef] = await Promise.all([
        this.prismaService.gameUploadSession.findMany({ select: { storage_path: true } }),
        this.prismaService.gameDownloadResourceFile.findMany({ select: { file_path: true } }),
      ])
      sessionsRef.forEach(s => s.storage_path && refs.add(s.storage_path))
      filesRef.forEach(f => f.file_path && refs.add(f.file_path))

      for (const p of entries) {
        if (refs.has(p)) continue
        try {
          const st = await fs.promises.stat(p)
          if (now - st.mtimeMs > orphanTtlMs) {
            await fs.promises.rm(p, { force: true })
          }
        } catch {
          /* empty */
        }
      }
    }
  }
}
