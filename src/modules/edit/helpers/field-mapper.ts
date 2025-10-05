import { GameFieldGroupBit } from '../enums/field-group.enum'

export const GameFieldGroupToFields: Record<GameFieldGroupBit, string[]> = {
  [GameFieldGroupBit.IDS]: ['v_id', 'b_id'],
  [GameFieldGroupBit.TITLES]: ['title_jp', 'title_zh', 'title_en'],
  [GameFieldGroupBit.INTROS]: ['intro_jp', 'intro_zh', 'intro_en'],
  [GameFieldGroupBit.ALIASES]: ['aliases'],
  [GameFieldGroupBit.RELEASE]: ['release_date'],
  [GameFieldGroupBit.TYPE]: ['type'],
  [GameFieldGroupBit.PLATFORMS]: ['platform'],
  [GameFieldGroupBit.EXTRA]: ['extra_info'],
  [GameFieldGroupBit.TAGS]: ['tags'],
  [GameFieldGroupBit.STAFFS]: ['staffs'],
  [GameFieldGroupBit.MANAGE_LINKS]: ['links'],
  [GameFieldGroupBit.MANAGE_COVERS]: ['covers'],
  [GameFieldGroupBit.MANAGE_IMAGES]: ['images'],
  [GameFieldGroupBit.MANAGE_DEVELOPERS]: ['developers'],
  [GameFieldGroupBit.MANAGE_CHARACTERS]: ['characters'],
  [GameFieldGroupBit.STATUS]: ['status'],
  [GameFieldGroupBit.NSFW]: ['nsfw'],
  [GameFieldGroupBit.VIEWS]: ['views'],
}

export const getEditableFields = (
  fieldGroups: Record<string, boolean>,
  mapping: Record<number, string[]> = GameFieldGroupToFields,
): string[] => {
  const editableFields: string[] = []

  for (const [fieldGroup, hasPermission] of Object.entries(fieldGroups)) {
    if (hasPermission) {
      const bitValue = GameFieldGroupBit[fieldGroup as keyof typeof GameFieldGroupBit]
      if (bitValue !== undefined && mapping[bitValue]) {
        editableFields.push(...mapping[bitValue])
      }
    }
  }

  return editableFields
}

export const createFieldPermissionMap = (
  fieldGroups: Record<string, boolean>,
  mapping: Record<number, string[]> = GameFieldGroupToFields,
): Record<string, boolean> => {
  const fieldMap: Record<string, boolean> = {}

  for (const [fieldGroup, hasPermission] of Object.entries(fieldGroups)) {
    const bitValue = GameFieldGroupBit[fieldGroup as keyof typeof GameFieldGroupBit]
    if (bitValue !== undefined && mapping[bitValue]) {
      for (const field of mapping[bitValue]) {
        fieldMap[field] = hasPermission
      }
    }
  }

  return fieldMap
}
