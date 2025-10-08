import { Module } from '@nestjs/common'
import { DomEnv } from './providers/dom-env.provider'
import { LexicalRendererService } from './services/lexical-renderer.service'

@Module({
  providers: [DomEnv, LexicalRendererService],
  exports: [LexicalRendererService],
})
export class RenderModule {}
