export interface IndexedGame {
  id: number
  title_jp?: string
  title_zh?: string
  title_en?: string
  aliases?: string[]
  intro_jp?: string
  intro_zh?: string
  intro_en?: string
  tags?: string[]
  platform?: string[]
  nsfw?: boolean
  release_date?: string | null
  developers?: { id: number; name: string; role?: string }[]
}
