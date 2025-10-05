export class GameScalarResDto {
  id: number
  b_id: string
  v_id: string
  title_jp: string
  title_zh: string
  title_en: string
  aliases: string[]
  intro_jp: string
  intro_zh: string
  intro_en: string
  platform: string[]
  release_date: string
  extra_info: ExtraInfo[]
  tags: string[]
  staffs: Staff[]
  status: number
  nsfw: boolean
  views: number
  type: string
}

class ExtraInfo {
  key: string
  value: string
}

class Staff {
  name: string
  role: string
}
