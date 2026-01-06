import {
  Controller,
  Patch,
  Body,
  ParseIntPipe,
  Param,
  Req,
  UseGuards,
  Put,
  Delete,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { GameEditService } from '../services/game-edit.service'
import {
  EditGameReqDto,
  RemoveGameLinkReqDto,
  AddGameLinkReqDto,
  EditGameLinkReqDto,
  EditGameCoverReqDto,
  AddGameCoverReqDto,
  RemoveGameCoverReqDto,
  EditGameCoverDto,
  EditGameImageReqDto,
  AddGameImageReqDto,
  RemoveGameImageReqDto,
  EditGameImageDto,
} from '../dto/req/edit-game.req.dto'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { EditAuthGuard } from '../../edit/guards/edit-auth.guard'
import { PermissionEntity } from '../../edit/enums/permission-entity.enum'
import { gameRequiredBits, GamekeyToBit } from '../../edit/resolvers/permisson-resolver'
import { GameFieldGroupBit } from '../../edit/enums/field-group.enum'

@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameEditController {
  constructor(private readonly gameEditService: GameEditService) {}

  @UseGuards(EditAuthGuard(PermissionEntity.GAME, gameRequiredBits, GamekeyToBit))
  @Patch(':id/edit/scalar')
  async editGameScalar(
    @Body() dto: EditGameReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editGameScalar(id, dto, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_LINKS],
      undefined,
      'links',
    ),
  )
  @Patch(':id/edit/links')
  async editLinks(
    @Body() dto: EditGameLinkReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editLinks(id, dto.links, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_LINKS],
      undefined,
      'links',
    ),
  )
  @Put(':id/edit/links')
  async addLinks(
    @Body() dto: AddGameLinkReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.addLinks(id, dto.links, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_LINKS],
      undefined,
      'links',
    ),
  )
  @Delete(':id/edit/links')
  async removeLinks(
    @Body() dto: RemoveGameLinkReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.removeLinks(id, dto.ids, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_COVERS],
      undefined,
      'covers',
    ),
  )
  @Patch(':id/edit/covers')
  async editCovers(
    @Body() dto: EditGameCoverReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editCovers(id, dto.covers, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_COVERS],
      undefined,
      'covers',
    ),
  )
  @Patch(':id/edit/cover')
  async editCover(
    @Body() dto: EditGameCoverDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editCover(id, dto, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_COVERS],
      undefined,
      'covers',
    ),
  )
  @Put(':id/edit/covers')
  async addCovers(
    @Body() dto: AddGameCoverReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.addCovers(id, dto.covers, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_COVERS],
      undefined,
      'covers',
    ),
  )
  @Delete(':id/edit/covers')
  async removeCovers(
    @Body() dto: RemoveGameCoverReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.removeCovers(id, dto.ids, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_IMAGES],
      undefined,
      'images',
    ),
  )
  @Patch(':id/edit/images')
  async editImages(
    @Body() dto: EditGameImageReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editImages(id, dto.images, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_IMAGES],
      undefined,
      'images',
    ),
  )
  @Patch(':id/edit/image')
  async editImage(
    @Body() dto: EditGameImageDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.editImage(id, dto, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_IMAGES],
      undefined,
      'images',
    ),
  )
  @Put(':id/edit/images')
  async addImages(
    @Body() dto: AddGameImageReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.addImages(id, dto.images, req)
  }

  @UseGuards(
    EditAuthGuard(
      PermissionEntity.GAME,
      () => [GameFieldGroupBit.MANAGE_IMAGES],
      undefined,
      'images',
    ),
  )
  @Delete(':id/edit/images')
  async removeImages(
    @Body() dto: RemoveGameImageReqDto,
    @Param('id', ParseIntPipe) id: number,
    @Req() req: RequestWithUser,
  ) {
    return this.gameEditService.removeImages(id, dto.ids, req)
  }
}
