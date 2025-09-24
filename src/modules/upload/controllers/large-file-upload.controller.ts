import {
  Controller,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Req,
  Param,
  UseGuards,
  Get,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../../modules/auth/guards/jwt-auth.guard'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { LargeFileUploadService } from '../services/large-file-upload.service'
import { GameUploadReqDto } from '../dto/req/game-upload.req.dto'

@UseGuards(JwtAuthGuard)
@Controller('uploads/large')
export class LargeFileUploadController {
  constructor(private readonly largeFileUploadService: LargeFileUploadService) {}

  @Post('init')
  async init(@Body() body: GameUploadReqDto, @Req() req: RequestWithUser) {
    return await this.largeFileUploadService.init(body, req)
  }

  @Put(':id/chunks/:index')
  async putChunk(
    @Req() req: RequestWithUser,
    @Param('index') index: string,
    @Param('id') id: string,
  ) {
    const content_length = Number(req.headers['content-length']) || 0
    const chunk_sha256 = req.headers['chunk-sha256'] as string
    return await this.largeFileUploadService.writeChunk(
      Number(id),
      Number(index),
      chunk_sha256,
      req,
      content_length,
    )
  }

  @Get(':id/status')
  async getStatus(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.largeFileUploadService.status(Number(id), req)
  }

  @Patch(':id/complete')
  async complete(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.largeFileUploadService.complete(Number(id), req)
  }

  @Delete(':id')
  async abort(@Param('id') id: string, @Req() req: RequestWithUser) {
    return await this.largeFileUploadService.abort(Number(id), req)
  }
}
