export interface VNDBReleaseItemRes {
  id: string
  languages: Language[]
  platforms: string[]
  images: Image[]
}

interface Language {
  lang: string
  latin: string
  mtl: string
  title: string
}

interface Image {
  type: 'pkgfront' | 'pkgback' | 'pkgcontent' | 'pkgside' | 'pkgmed' | 'dig'
  languages: string[]
  photo: string
  id: string
  url: string
  dims: number[]
}
