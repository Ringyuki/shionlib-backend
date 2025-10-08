import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CreateCommentReqDto } from '../dto/req/create-comment.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { EditCommentReqDto } from '../dto/req/edit-comment.req.dto'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { PaginatedResult } from '../../../shared/interfaces/response/response.interface'
import { ShionlibUserRoles } from '../../../shared/enums/auth/user-role.enum'
import { CommentResDto } from '../dto/res/comment.res.dto'
import { LexicalRendererService } from '../../render/services/lexical-renderer.service'
import { SerializedEditorState } from 'lexical'

@Injectable()
export class CommentServices {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly renderService: LexicalRendererService,
  ) {}

  async createGameComment(game_id: number, dto: CreateCommentReqDto, req: RequestWithUser) {
    const { content, parent_id } = dto

    let root_id: number | null = null
    return await this.prismaService.$transaction(async tx => {
      if (parent_id) {
        const parent = await tx.comment.findUnique({
          where: { id: parent_id },
          select: { id: true, game_id: true, root_id: true },
        })
        if (!parent || parent.game_id !== game_id) {
          throw new ShionBizException(ShionBizCode.COMMENT_NOT_FOUND)
        }
        root_id = parent.root_id ?? parent.id
      }

      const html = this.renderService.toHtml(content as SerializedEditorState)

      const comment = await tx.comment.create({
        data: {
          content,
          html,
          game_id,
          creator_id: req.user.sub,
          parent_id,
          root_id,
        },
        select: {
          id: true,
          content: true,
          html: true,
          parent_id: true,
          root_id: true,
          creator: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
          created: true,
          updated: true,
        },
      })
      if (!root_id) {
        await tx.comment.update({
          where: { id: comment.id },
          data: { root_id: comment.id },
        })
      }
      if (parent_id) {
        await tx.comment.update({
          where: { id: parent_id },
          data: { reply_count: { increment: 1 } },
        })
      }
      if (root_id && root_id !== comment.id) {
        await tx.comment.update({
          where: { id: root_id },
          data: { reply_count: { increment: 1 } },
        })
      }
      return {
        ...comment,
        root_id: root_id || comment.id,
      }
    })
  }

  async editComment(id: number, dto: EditCommentReqDto, req: RequestWithUser) {
    if (!id || id <= 0) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_FOUND)
    }
    const { content } = dto
    const existed = await this.prismaService.comment.findUnique({
      where: { id },
    })
    if (!existed) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_FOUND)
    }

    if (existed.creator_id !== req.user.sub && req.user.role !== ShionlibUserRoles.ADMIN) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_OWNER)
    }

    const html = this.renderService.toHtml(content as SerializedEditorState)

    return await this.prismaService.comment.update({
      where: { id },
      data: { content, html },
      select: {
        id: true,
        content: true,
        html: true,
        parent_id: true,
        root_id: true,
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        created: true,
        updated: true,
      },
    })
  }

  async deleteComment(id: number, req: RequestWithUser) {
    if (!id || id <= 0) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_FOUND)
    }
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
    })
    if (!comment) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_FOUND)
    }

    if (comment.creator_id !== req.user.sub && req.user.role !== ShionlibUserRoles.ADMIN) {
      throw new ShionBizException(ShionBizCode.COMMENT_NOT_OWNER)
    }

    await this.prismaService.$transaction(async tx => {
      await tx.comment.delete({
        where: { id },
      })
      if (comment.parent_id) {
        await tx.comment.update({
          where: { id: comment.parent_id },
          data: { reply_count: { decrement: 1 } },
        })
      }
      if (comment.root_id && comment.root_id !== comment.id) {
        await tx.comment.update({
          where: { id: comment.root_id },
          data: { reply_count: { decrement: 1 } },
        })
      }
    })
  }

  async getGameComments(
    game_id: number,
    page = 1,
    pageSize = 10,
    req: RequestWithUser,
  ): Promise<PaginatedResult<CommentResDto>> {
    const total = await this.prismaService.comment.count({
      where: { game_id },
    })

    const comments = await this.prismaService.comment.findMany({
      where: { game_id, status: 1 },
      orderBy: [{ created: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        content: true,
        html: true,
        parent_id: true,
        root_id: true,
        reply_count: true,
        liked_users: { where: { id: req.user?.sub || 0 }, select: { id: true }, take: 1 },
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        created: true,
        updated: true,
      },
    })

    return {
      items: comments.map(comment => ({
        id: comment.id,
        content: comment.content as Record<string, any>,
        html: comment.html,
        parent_id: comment.parent_id,
        root_id: comment.root_id,
        reply_count: comment.reply_count,
        is_liked: comment.liked_users.length > 0,
        creator: comment.creator,
        created: comment.created,
        updated: comment.updated,
      })),
      meta: {
        totalItems: total,
        itemCount: comments.length,
        itemsPerPage: pageSize,
        totalPages: Math.ceil(total / pageSize),
        currentPage: page,
      },
    }
  }
}
