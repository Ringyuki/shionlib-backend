export interface UserInterface {
  id: number
  name: string
  avatar: string | null
  cover: string | null
  email: string
  role: number
  lang: UserLang
}

export enum UserLang {
  EN = 'en',
  ZH = 'zh',
  JA = 'ja',
}
