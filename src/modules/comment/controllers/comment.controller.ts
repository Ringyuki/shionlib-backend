import {
  Controller,
  Post,
  Body,
  Req,
  Param,
  ParseIntPipe,
  Get,
  Query,
  Patch,
  Delete,
  UseGuards,
} from '@nestjs/common'
import { CommentServices } from '../services/comment.services'
import { CreateCommentReqDto } from '../dto/req/create-comment.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { EditCommentReqDto } from '../dto/req/edit-comment.req.dto'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'

@Controller('comment')
export class CommentController {
  constructor(private readonly commentServices: CommentServices) {}

  @UseGuards(JwtAuthGuard)
  @Post('game/:game_id')
  async createComment(
    @Body() dto: CreateCommentReqDto,
    @Param('game_id', ParseIntPipe) game_id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.commentServices.createGameComment(game_id, dto, req)
  }

  @UseGuards(JwtAuthGuard)
  @Patch('game/:game_id/:comment_id')
  async editComment(
    @Body() dto: EditCommentReqDto,
    @Param('comment_id', ParseIntPipe) comment_id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.commentServices.editComment(comment_id, dto, req)
  }

  @UseGuards(JwtAuthGuard)
  @Delete('game/:game_id/:comment_id')
  async deleteComment(
    @Param('comment_id', ParseIntPipe) comment_id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.commentServices.deleteComment(comment_id, req)
  }

  @Get('game/:game_id')
  async getGameComments(
    @Param('game_id', ParseIntPipe) game_id: number,
    @Query('page', ParseIntPipe) page = 1,
    @Query('page_size', ParseIntPipe) page_size = 10,
    @Req() req: RequestWithUser,
  ) {
    return this.commentServices.getGameComments(game_id, page, page_size, req)
  }
}
