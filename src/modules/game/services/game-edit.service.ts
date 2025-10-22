import { Injectable, Inject } from '@nestjs/common'
import { PrismaService } from '../../../prisma.service'
import {
  EditGameReqDto,
  GameLinkDto,
  EditGameLinkDto,
  EditGameCoverDto,
  GameCoverDto,
} from '../dto/req/edit-game.req.dto'
import { PermissionEntity } from '../../edit/enums/permission-entity.enum'
import { EditActionType } from '../../edit/enums/edit-action-type.enum'
import { EditRelationType } from '../../edit/enums/edit-relation-type.enum'
import { RequestWithUser } from '../../../shared/interfaces/auth/request-with-user.interface'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { pickChanges } from '../helpers/pick-changes'
import { gameRequiredBits } from '../../edit/resolvers/permisson-resolver'
import { formatDoc, rawDataQuery } from '../../search/helpers/format-doc'
import { GameData } from '../interfaces/game.interface'
import { SearchEngine, SEARCH_ENGINE } from '../../search/interfaces/search.interface'

@Injectable()
export class GameEditService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(SEARCH_ENGINE) private readonly searchEngine: SearchEngine,
  ) {}

  async editGameScalar(id: number, dto: EditGameReqDto, req: RequestWithUser) {
    const game = await this.prisma.game.findUnique({
      where: { id },
    })
    if (!game) {
      throw new ShionBizException(ShionBizCode.GAME_NOT_FOUND)
    }

    const { before, after, field_changes } = pickChanges(dto, game as unknown as EditGameReqDto)
    if (field_changes.length === 0) return

    const bits = gameRequiredBits(after)
    const field_mask = bits.reduce((m, b) => m | (1n << BigInt(b)), 0n)

    await this.prisma.$transaction(async tx => {
      await tx.game.update({
        where: { id },
        data: {
          ...dto,
          extra_info: dto.extra_info ? (dto.extra_info as any) : undefined,
          staffs: dto.staffs ? (dto.staffs as any) : undefined,
        },
      })

      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.UPDATE_SCALAR,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          field_mask,
          changes: { before, after } as any,
          field_changes,
        },
      })
    })

    const updated = await this.prisma.game.findUnique({
      where: { id: game.id },
      select: rawDataQuery,
    })
    await this.searchEngine.upsertGame(formatDoc(updated as unknown as GameData))
  }

  async editLinks(id: number, links: EditGameLinkDto[], req: RequestWithUser) {
    const linksToEdit = await this.prisma.gameLink.findMany({
      where: { game_id: id, id: { in: links.map(l => l.id) } },
      select: { id: true, url: true, label: true, name: true },
    })
    if (linksToEdit.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameLink.updateMany({
        where: { game_id: id, id: { in: links.map(l => l.id) } },
        data: links.map(l => ({ url: l.url, label: l.label, name: l.name })),
      })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.UPDATE_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.LINK,
          field_changes: ['links'],
          changes: {
            relation: 'links',
            before: linksToEdit,
            after: links.map(l => ({ id: l.id, url: l.url, label: l.label, name: l.name })),
          } as any,
        },
      })
    })
  }

  async addLinks(id: number, links: GameLinkDto[], req: RequestWithUser) {
    const exisited = await this.prisma.gameLink.findMany({
      where: { game_id: id },
      select: { url: true, label: true, name: true },
    })
    const uniqueLinks = links.filter(l => !exisited.some(e => e.url === l.url))
    if (uniqueLinks.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameLink.createMany({
        data: uniqueLinks.map(l => ({ game_id: id, url: l.url, label: l.label, name: l.name })),
      })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.ADD_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.LINK,
          field_changes: ['links'],
          changes: { relation: 'links', added: uniqueLinks } as any,
        },
      })
    })
  }

  async removeLinks(id: number, links: number[], req: RequestWithUser) {
    const linksToRemove = await this.prisma.gameLink.findMany({
      where: { game_id: id, id: { in: links } },
      select: { id: true, url: true, label: true, name: true },
    })
    if (linksToRemove.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameLink.deleteMany({ where: { game_id: id, id: { in: links } } })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.REMOVE_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.LINK,
          field_changes: ['links'],
          changes: { relation: 'links', removed: linksToRemove } as any,
        },
      })
    })
  }

  async editCovers(id: number, covers: EditGameCoverDto[], req: RequestWithUser) {
    const coversToEdit = await this.prisma.gameCover.findMany({
      where: { game_id: id, id: { in: covers.map(c => c.id) } },
      select: { id: true, url: true, type: true, dims: true, sexual: true, violence: true },
    })
    if (coversToEdit.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameCover.updateMany({
        where: { game_id: id, id: { in: covers.map(c => c.id) } },
        data: covers.map(c => ({
          url: c.url,
          type: c.type,
          dims: c.dims,
          sexual: c.sexual,
          violence: c.violence,
        })),
      })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.UPDATE_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.COVER,
          field_changes: ['covers'],
          changes: {
            relation: 'covers',
            before: coversToEdit,
            after: covers.map(c => ({
              id: c.id,
              url: c.url,
              type: c.type,
              dims: c.dims,
              sexual: c.sexual,
              violence: c.violence,
            })),
          } as any,
        },
      })
    })

    const game = await this.prisma.game.findUnique({
      where: { id },
      select: rawDataQuery,
    })

    await this.searchEngine.upsertGame(formatDoc(game as unknown as GameData))
  }

  async addCovers(id: number, covers: GameCoverDto[], req: RequestWithUser) {
    const exisited = await this.prisma.gameCover.findMany({
      where: { game_id: id },
      select: { url: true, type: true, dims: true, sexual: true, violence: true },
    })
    const uniqueCovers = covers.filter(c => !exisited.some(e => e.url === c.url))
    if (uniqueCovers.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameCover.createMany({
        data: uniqueCovers.map(c => ({
          game_id: id,
          language: c.language,
          url: c.url,
          type: c.type,
          dims: c.dims,
          sexual: c.sexual,
          violence: c.violence,
        })),
      })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.ADD_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.COVER,
          field_changes: ['covers'],
          changes: { relation: 'covers', added: uniqueCovers } as any,
        },
      })
    })

    const updated = await this.prisma.game.findUnique({
      where: { id },
      select: rawDataQuery,
    })
    await this.searchEngine.upsertGame(formatDoc(updated as unknown as GameData))
  }

  async removeCovers(id: number, covers: number[], req: RequestWithUser) {
    const coversToRemove = await this.prisma.gameCover.findMany({
      where: { game_id: id, id: { in: covers } },
      select: { id: true, url: true, type: true, dims: true, sexual: true, violence: true },
    })
    if (coversToRemove.length === 0) return

    await this.prisma.$transaction(async tx => {
      await tx.gameCover.deleteMany({ where: { game_id: id, id: { in: covers } } })
      await tx.editRecord.create({
        data: {
          entity: PermissionEntity.GAME,
          target_id: id,
          action: EditActionType.REMOVE_RELATION,
          actor_id: req.user.sub,
          actor_role: req.user.role,
          relation_type: EditRelationType.COVER,
          field_changes: ['covers'],
          changes: { relation: 'covers', removed: coversToRemove } as any,
        },
      })
    })

    const updated = await this.prisma.game.findUnique({
      where: { id },
      select: rawDataQuery,
    })
    await this.searchEngine.upsertGame(formatDoc(updated as unknown as GameData))
  }
}
