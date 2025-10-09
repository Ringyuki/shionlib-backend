export class CommentResDto {
  id: number
  html: string | null
  parent_id: number | null
  root_id: number | null
  reply_count: number
  is_liked: boolean
  like_count: number
  creator: {
    id: number
    name: string
    avatar: string | null
  }
  edited: boolean
  created: Date
  updated: Date
}
