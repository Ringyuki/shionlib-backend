import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import {
  AdjustQuotaSizeAmountReqDto,
  AdjustQuotaUsedAmountReqDto,
} from '../dto/req/adjust-quota.req.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

@Injectable()
export class UploadQuotaService {
  constructor(private readonly prisma: PrismaService) {}

  async getUploadQuota(user_id: number) {
    const quota = await this.prisma.userUploadQuota.findUnique({
      where: { user_id },
      select: {
        size: true,
        used: true,
      },
    })
    if (!quota) {
      return {
        size: 0,
        used: 0,
      }
    }
    return {
      size: Number(quota.size),
      used: Number(quota.used),
    }
  }

  async adjustUploadQuotaUsedAmount(user_id: number, dto: AdjustQuotaUsedAmountReqDto) {
    await this.prisma.$transaction(async tx => {
      const quota = await tx.userUploadQuota.findUnique({
        where: { user_id },
      })
      if (!quota) {
        throw new ShionBizException(
          ShionBizCode.USER_UPLOAD_QUOTA_NOT_FOUND,
          'shion-biz.USER_UPLOAD_QUOTA_NOT_FOUND',
        )
      }

      const amount = BigInt(dto.amount)
      const delta = dto.action === 'USE' ? amount : -amount

      if (dto.action === 'USE' && quota.used + amount > quota.size) {
        throw new ShionBizException(
          ShionBizCode.USER_UPLOAD_QUOTA_EXCEEDED,
          'shion-biz.USER_UPLOAD_QUOTA_EXCEEDED',
        )
      } else if (dto.action === 'ADD' && quota.used < amount) {
        throw new ShionBizException(
          ShionBizCode.USER_UPLOAD_QUOTA_USE_CANT_BE_NEGATIVE,
          'shion-biz.USER_UPLOAD_QUOTA_USE_CANT_BE_NEGATIVE',
        )
      }

      await tx.userUploadQuotaRecord.create({
        data: {
          field: 'USED',
          amount,
          action: dto.action,
          action_reason: dto.action_reason,
          upload_session_id: dto.upload_session_id,
          user_upload_quota_id: quota.id,
        },
      })
      await tx.userUploadQuota.update({
        where: { id: quota.id },
        data: {
          used: {
            increment: delta,
          },
        },
      })
    })
  }

  async adjustUploadQuotaSizeAmount(user_id: number, dto: AdjustQuotaSizeAmountReqDto) {
    await this.prisma.$transaction(async tx => {
      const quota = await tx.userUploadQuota.findUnique({
        where: { user_id },
      })
      if (!quota) {
        throw new ShionBizException(
          ShionBizCode.USER_UPLOAD_QUOTA_NOT_FOUND,
          'shion-biz.USER_UPLOAD_QUOTA_NOT_FOUND',
        )
      }
      const amount = BigInt(dto.amount)
      const delta = dto.action === 'ADD' ? amount : -amount

      await tx.userUploadQuotaRecord.create({
        data: {
          field: 'SIZE',
          amount,
          action: dto.action,
          action_reason: dto.action_reason,
          user_upload_quota_id: quota.id,
        },
      })
      await tx.userUploadQuota.update({
        where: { id: quota.id },
        data: {
          size: {
            increment: delta,
          },
        },
      })
    })
  }

  async withdrawUploadQuotaUseAdjustment(user_id: number, session_id: number) {
    await this.prisma.$transaction(async tx => {
      const record = await tx.userUploadQuotaRecord.findFirst({
        where: {
          user_upload_quota: { user_id },
          upload_session_id: session_id,
          action: { in: ['USE', 'ADD'] },
          field: 'USED',
        },
        orderBy: { created: 'asc' },
      })
      if (!record) return

      const delta = record.action === 'USE' ? record.amount : -record.amount

      await tx.userUploadQuotaRecord.create({
        data: {
          field: 'USED',
          amount: delta,
          action: 'SUB',
          action_reason: 'WITHDRAW_UPLOAD_QUOTA_USE_ADJUSTMENT',
          upload_session_id: session_id,
          user_upload_quota_id: record.user_upload_quota_id,
        },
      })
      await tx.userUploadQuota.update({
        where: { id: record.user_upload_quota_id },
        data: {
          used: {
            decrement: delta,
          },
        },
      })
    })
  }

  async isExceeded(user_id: number, amount: number) {
    const record = await this.prisma.userUploadQuota.findUnique({
      where: { user_id },
      select: {
        used: true,
        size: true,
      },
    })
    if (!record) {
      throw new ShionBizException(
        ShionBizCode.USER_UPLOAD_QUOTA_NOT_FOUND,
        'shion-biz.USER_UPLOAD_QUOTA_NOT_FOUND',
      )
    }
    return record.used + BigInt(amount) > record.size
  }
}
