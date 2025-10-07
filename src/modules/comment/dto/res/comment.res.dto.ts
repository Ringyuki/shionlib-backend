export class CommentResDto {
  id: number
  content: Record<string, any>
  parent_id: number | null
  root_id: number | null
  reply_count: number
  is_liked: boolean
  creator: {
    id: number
    name: string
    avatar: string | null
  }
  created: Date
  updated: Date
}
