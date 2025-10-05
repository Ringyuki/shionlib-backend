import { GameFieldGroupBit } from '../enums/field-group.enum'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'

export const GamekeyToBit: Record<string, GameFieldGroupBit> = {
  b_id: GameFieldGroupBit.IDS,
  v_id: GameFieldGroupBit.IDS,
  title_jp: GameFieldGroupBit.TITLES,
  title_zh: GameFieldGroupBit.TITLES,
  title_en: GameFieldGroupBit.TITLES,
  intro_jp: GameFieldGroupBit.INTROS,
  intro_zh: GameFieldGroupBit.INTROS,
  intro_en: GameFieldGroupBit.INTROS,
  aliases: GameFieldGroupBit.ALIASES,
  release_date: GameFieldGroupBit.RELEASE,
  nsfw: GameFieldGroupBit.NSFW,
  type: GameFieldGroupBit.TYPE,
  platform: GameFieldGroupBit.PLATFORMS,
  extra_info: GameFieldGroupBit.EXTRA,
  tags: GameFieldGroupBit.TAGS,
  staffs: GameFieldGroupBit.STAFFS,
  status: GameFieldGroupBit.STATUS,
  views: GameFieldGroupBit.VIEWS,
}

export const gameRequiredBits = (dto: Record<string, unknown>): number[] => {
  if (typeof dto !== 'object')
    throw new ShionBizException(
      ShionBizCode.COMMON_VALIDATION_FAILED,
      'shion-biz.COMMON_VALIDATION_FAILED',
    )

  const bits = new Set<number>()
  for (const key of Object.keys(dto)) {
    const bit = GamekeyToBit[key]
    if (bit !== undefined) bits.add(bit)
  }
  return [...bits]
}
