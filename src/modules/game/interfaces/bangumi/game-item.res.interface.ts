export interface BangumiGameItemRes {
  id: number
  date: string
  platform: string
  images: Image
  summary: string
  name: string
  name_cn: string
  tags: Tag[]
  infobox: Infobox[]
}

export interface Image {
  small: string
  grid: string
  large: string
  medium: string
  common: string
}

interface Tag {
  name: string
  count: number
  total_cont: number
}

export interface Infobox {
  key: string
  value: string | Array<InfoboxValueArray>
}

export interface InfoboxValueArray {
  k: string
  v: string
}

export interface BangumiGameCharacterRelationItemRes {
  id: number
  relation: string
  name: string
  images: Image
  actors: Actor[]
}

export interface Actor {
  id: number
  name: string
}

export interface BangumiGamePersonRelationItemRes {
  id: number
  relation: string
  name: string
  images: Image
}
