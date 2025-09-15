export interface GameData {
  creator_id: number

  b_id?: string
  v_id?: string

  title_jp: string
  title_zh: string
  title_en: string
  aliases: string[]
  intro_jp: string
  intro_zh: string
  intro_en: string
  covers?: GameCover[]
  images: string[]
  extra_info: Record<string, string>[]

  tags: string[]
  staffs: GameStaff[]

  nsfw: boolean
  type?: string
  platform?: string[]
}

interface GameStaff {
  name: string
  role: string
}

export interface GameDeveloper {
  b_id?: string
  v_id?: string
  name: string
  aliases?: string[]
  logo?: string
  intro_jp?: string
  intro_zh?: string
  intro_en?: string
  extra_info?: Record<string, string>[]
}

export interface GameDeveloperRelation {
  role: string
  game_id: number
  developer_id: number
}

export interface GameCharacter {
  b_id?: string
  v_id?: string
  image?: string
  actor?: string
  role?: string

  name_jp?: string
  name_zh?: string
  name_en?: string
  aliases?: string[]
  intro_jp?: string
  intro_zh?: string
  intro_en?: string
  gender?: string

  extra_info?: Record<string, string>[]
}

export interface GameCharacterRelation {
  image?: string
  actor?: string
  role?: string
  extra_info?: Record<string, string>[]

  game_id: number
  character_id: number
}

export interface GameCover {
  language: string
  url: string
  type: string
  dims: number[]
}

export interface GameCoverRelation {
  game_id: number
  cover_id: number
}
