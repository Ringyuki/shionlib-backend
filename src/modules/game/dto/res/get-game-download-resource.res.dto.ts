import { GamePlatform } from '../../interfaces/game.interface'

export class GetGameDownloadResourceResDto {
  id: number
  platform: GamePlatform[]
  language: ('zh' | 'en' | 'jp')[]
  note?: string
  downloads: number
  creator: Creator
  files: GameDownloadResourceFile[]
  created: string
  updated: string
}

export class GameDownloadResourceFile {
  id: number
  type: number
  file_name: string
  file_size: number
  file_url: string
  s3_file_key: string
  file_hash: string
  creator: Creator
}

class Creator {
  id: number
  name: string
  avatar: string
}
