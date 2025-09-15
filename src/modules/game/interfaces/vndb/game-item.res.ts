export interface VNDBGameItemRes {
  id: string
  titles: Title[]
  aliases: string[]
  image: { url: string }
  description: string
  platforms: string[]
  screenshots: Screenshot[]
  va: VA[]
  developers: Developer[]
}

interface Title {
  lang: string
  latin: string
  main: boolean
  title: string
}

interface Screenshot {
  url: string
}

interface VA {
  character: Character
}

interface Character {
  id: string
  name: string
  original: string
  aliases: string[]
  description: string
  image: Array<{ url: string }>
  vns: Array<{ role: 'main' | 'primary' | 'side' | 'appears' }>
}

interface Developer {
  id: string
  name: string
  original: string
  aliases: string[]
  description: string
  // "co" for company, "in" for individual and "ng" for amateur group.
  type: 'co' | 'in' | 'ng'
  extlinks: Extlink[]
}

interface Extlink {
  label: string
  name: string
  url: string
}
