import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import { SendMessageReqDto } from '../dto/req/send-message.req.dto'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import { GetMessagesReqDto } from '../dto/req/get-messages.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { MessageListItemResDto } from '../dto/res/message-list.res.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { Prisma } from '@prisma/client'

@Injectable()
export class MessageService {
  constructor(private readonly prisma: PrismaService) {}

  async send(sendMessageReqDto: SendMessageReqDto, tx?: Prisma.TransactionClient) {
    const {
      type,
      title,
      content,
      link_text,
      link_url,
      external_link,
      comment_id,
      game_id,
      sender_id,
      receiver_id,
    } = sendMessageReqDto

    await (tx || this.prisma).message.create({
      data: {
        type,
        title,
        content,
        link_text,
        link_url,
        external_link,
        comment_id,
        game_id,
        sender_id,
        receiver_id,
      },
    })
  }

  async getList(
    paginationReqDto: GetMessagesReqDto,
    req: RequestWithUser,
  ): Promise<PaginatedResult<MessageListItemResDto>> {
    const { page, pageSize, unread, type } = paginationReqDto

    const total = await this.prisma.message.count({
      where: {
        receiver_id: req.user.sub,
        ...(unread ? { read: false } : {}),
        ...(type ? { type } : {}),
      },
    })
    const messages = await this.prisma.message.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        created: 'desc',
      },
      where: {
        receiver_id: req.user.sub,
        ...(unread ? { read: false } : {}),
        ...(type ? { type } : {}),
      },
      select: {
        id: true,
        type: true,
        title: true,
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        read: true,
        read_at: true,
        created: true,
        updated: true,
      },
    })

    return {
      items: messages as unknown as MessageListItemResDto[],
      meta: {
        totalItems: total,
        itemCount: messages.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }

  async getUnreadCount(req: RequestWithUser) {
    return await this.prisma.message.count({
      where: {
        receiver_id: req.user.sub,
        read: false,
      },
    })
  }

  async getById(id: number, req: RequestWithUser) {
    const message = await this.prisma.message.findUnique({
      where: { id, receiver_id: req.user.sub },
      select: {
        id: true,
        type: true,
        title: true,
        content: true,
        link_text: true,
        link_url: true,
        external_link: true,
        comment: {
          select: {
            id: true,
            html: true,
          },
        },
        game: {
          select: {
            id: true,
            title_zh: true,
            title_en: true,
            title_jp: true,
          },
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        read: true,
        read_at: true,
        created: true,
        updated: true,
      },
    })
    if (!message) {
      throw new ShionBizException(ShionBizCode.MESSAGE_NOT_FOUND, 'shion-biz.MESSAGE_NOT_FOUND')
    }
    if (message.receiver.id !== req.user.sub) {
      throw new ShionBizException(ShionBizCode.MESSAGE_FORBIDDEN, 'shion-biz.MESSAGE_FORBIDDEN')
    }
    return message
  }

  async markAsRead(id: number, req: RequestWithUser) {
    await this.prisma.message.update({
      where: { id, receiver_id: req.user.sub },
      data: { read: true, read_at: new Date() },
    })
  }

  async markAllAsRead(req: RequestWithUser) {
    await this.prisma.message.updateMany({
      where: { receiver_id: req.user.sub, read: false },
      data: { read: true, read_at: new Date() },
    })
  }
}
