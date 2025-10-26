import { Module } from '@nestjs/common'
import { CommentController } from './controllers/comment.controller'
import { CommentServices } from './services/comment.service'
import { RenderModule } from '../render/render.module'

@Module({
  controllers: [CommentController],
  providers: [CommentServices],
  imports: [RenderModule],
})
export class CommentModule {}
