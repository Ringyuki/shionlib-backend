import { Module } from '@nestjs/common'
import { CommentController } from './controllers/comment.controller'
import { CommentServices } from './services/comment.services'

@Module({
  controllers: [CommentController],
  providers: [CommentServices],
})
export class CommentModule {}
