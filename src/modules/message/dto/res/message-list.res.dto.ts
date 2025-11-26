import { MessageType } from '../req/send-message.req.dto'

export class MessageListItemResDto {
  id: number
  type: MessageType
  title: string
  sender?: {
    id: number
    name: string
    avatar: string
  }

  read: boolean
  read_at?: Date
  created: Date
  updated: Date
}
