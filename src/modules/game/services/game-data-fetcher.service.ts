import { Injectable } from '@nestjs/common'
import { BangumiAuthService } from '../../bangumi/services/bangumi-auth.service'
import { detectLanguage } from '../utils/language-detector.util'
import {
  BangumiGameItemRes,
  BangumiGameCharacterRelationItemRes,
  BangumiGamePersonRelationItemRes,
  InfoboxValueArray,
} from '../interfaces/bangumi/game-item.res.interface'
import { BangumiCharacterItemRes } from '../interfaces/bangumi/character-item.res.interface'
import { BangumiProducerItemRes } from '../interfaces/bangumi/producer-item.res.interface'
import { GameCharacter, GameCover, GameData, GameDeveloper } from '../interfaces/game.interface'
import { VNDBService } from '../../vndb/services/vndb.service'
import { VNDBGameItemRes } from '../interfaces/vndb/game-item.res'
import { ShionBizException } from '../../../common/exceptions/shion-business.exception'
import { ShionBizCode } from '../../../shared/enums/biz-code/shion-biz-code.enum'
import { VNDBReleaseItemRes } from '../interfaces/vndb/release-item.res'

@Injectable()
export class GameDataFetcherService {
  constructor(
    private readonly bangumiService: BangumiAuthService,
    private readonly vndbService: VNDBService,
  ) {}

  async fetchData(
    b_id: string,
    v_id?: string,
  ): Promise<{
    finalGameData: GameData
    finalCharactersData: GameCharacter[]
    finalProducersData: GameDeveloper[]
    finalCoversData?: GameCover[]
  }> {
    if (v_id && !v_id.startsWith('v')) {
      throw new ShionBizException(ShionBizCode.GAME_INVALID_VNDB_ID)
    }
    return this.fetchDatafromBangumi(b_id, v_id)
  }

  private async fetchDatafromBangumi(b_id: string, v_id?: string) {
    const [rawGameData, rawCharacterData, rawPersonData] = await Promise.all([
      this.bangumiService.bangumiRequest<BangumiGameItemRes>(
        `https://api.bgm.tv/v0/subjects/${b_id}`,
      ),
      this.bangumiService.bangumiRequest<BangumiGameCharacterRelationItemRes[]>(
        `https://api.bgm.tv/v0/subjects/${b_id}/characters`,
      ),
      this.bangumiService.bangumiRequest<BangumiGamePersonRelationItemRes[]>(
        `https://api.bgm.tv/v0/subjects/${b_id}/persons`,
      ),
    ])

    const finalGameData: GameData = {} as GameData
    const finalProducersData: GameDeveloper[] = []
    const finalCharactersData: GameCharacter[] = []
    try {
      const characterIds = rawCharacterData.map(c => c.id)
      const producerids = rawPersonData.filter(p => p.relation === '开发').map(p => p.id)

      const [rawFullCharactersData, rawFullProducersData] = await Promise.all([
        this.fetchRawFullCharactersDataFromBangumi(characterIds),
        this.fetchRawFullProducersDataFromBangumi(producerids),
      ])

      finalGameData.b_id = rawGameData.id.toString()
      if ((await detectLanguage(rawGameData.name)) === 'en')
        finalGameData.title_en = rawGameData.name
      else if (
        (await detectLanguage(rawGameData.name)) === 'jp' ||
        (await detectLanguage(rawGameData.name)) === 'unknown'
      )
        finalGameData.title_jp = rawGameData.name
      else if ((await detectLanguage(rawGameData.name)) === 'zh')
        finalGameData.title_zh = rawGameData.name
      if (rawGameData.name_cn) finalGameData.title_zh = rawGameData.name_cn

      if ((await detectLanguage(rawGameData.summary)) === 'zh')
        finalGameData.intro_zh = rawGameData.summary
      else if ((await detectLanguage(rawGameData.summary)) === 'jp')
        finalGameData.intro_jp = rawGameData.summary

      finalGameData.tags = rawGameData.tags.map(tag => tag.name)

      const exludedKeys = new Set([
        '中文名',
        '别名',
        '平台',
        '游戏类型',
        '游戏引擎',
        '游玩人数',
        '发行日期',
        '售价',
        '开发',
        'website',
        '链接',
      ])
      finalGameData.staffs = rawGameData.infobox
        .filter(i => !exludedKeys.has(i.key))
        .map(i => ({
          name: typeof i.value === 'string' ? i.value : i.value.map(v => v.v).join(', '),
          role: i.key,
        }))

      for (const character of rawCharacterData) {
        finalCharactersData.push({
          b_id: character.id.toString(),
          name_jp: character.name,
          name_zh: character.name,
          actor: character.actors.map(a => a.name).join(', '),
          role: character.relation,
          image: character.images.large,
        })
      }
      for (const character of finalCharactersData) {
        const rawFullCharacterData = rawFullCharactersData.find(
          c => String(c.id) === character.b_id,
        )
        if (rawFullCharacterData) {
          character.name_zh = rawFullCharacterData.infobox.find(i => i.key === '简体中文名')
            ?.value as string
          character.gender = rawFullCharacterData.gender
          if ((await detectLanguage(rawFullCharacterData.summary)) === 'zh')
            character.intro_zh = rawFullCharacterData.summary
          else character.intro_jp = rawFullCharacterData.summary

          const rawAliases = rawFullCharacterData.infobox.find(i => i.key === '别名')
          if (rawAliases && rawAliases.value.length) {
            character.aliases = []
            if (typeof rawAliases.value === 'string') character.aliases.push(rawAliases.value)
            else
              for (const a of rawAliases.value as InfoboxValueArray[]) character.aliases.push(a.v)
          }
          character.extra_info = rawFullCharacterData.infobox
            .filter(i => !['简体中文名', '别名'].includes(i.key))
            .map(i => ({
              key: i.key,
              value: typeof i.value === 'string' ? i.value : i.value.map(v => v.v).join(', '),
            }))
        }
      }

      for (const producer of rawPersonData.filter(p => p.relation === '开发')) {
        finalProducersData.push({
          b_id: producer.id.toString(),
          name: producer.name,
          logo: producer.images.large,
        })
      }
      for (const producer of finalProducersData) {
        const rawFullProducerData = rawFullProducersData.find(p => String(p.id) === producer.b_id)
        if (rawFullProducerData) {
          if ((await detectLanguage(rawFullProducerData.summary)) === 'zh')
            producer.intro_zh = rawFullProducerData.summary
          else producer.intro_jp = rawFullProducerData.summary

          const rawAliases = rawFullProducerData.infobox.find(i => i.key === '别名')
          if (rawAliases && rawAliases.value.length) {
            producer.aliases = []
            if (typeof rawAliases.value === 'string') producer.aliases.push(rawAliases.value)
            else for (const a of rawAliases.value as InfoboxValueArray[]) producer.aliases.push(a.v)
          }
          producer.extra_info = rawFullProducerData.infobox
            .filter(i => !['简体中文名', '别名'].includes(i.key))
            .map(i => ({
              key: i.key,
              value: typeof i.value === 'string' ? i.value : i.value.map(v => v.v).join(', '),
            }))
        }
      }
    } catch (error) {
      console.error(error)
      throw error
    }

    if (v_id) {
      return this.fetchDataFromVNDB(v_id, finalGameData, finalCharactersData, finalProducersData)
    }
    return { finalGameData, finalCharactersData, finalProducersData }
  }

  private async fetchRawFullCharactersDataFromBangumi(ids: number[]) {
    const charactersData: BangumiCharacterItemRes[] = []

    const promises = ids.map(id =>
      this.bangumiService.bangumiRequest<BangumiCharacterItemRes>(
        `https://api.bgm.tv/v0/characters/${id}`,
      ),
    )
    const results = await Promise.all(promises)
    charactersData.push(...results)
    return charactersData
  }

  private async fetchRawFullProducersDataFromBangumi(ids: number[]) {
    const producersData: BangumiProducerItemRes[] = []
    const promises = ids.map(id =>
      this.bangumiService.bangumiRequest<BangumiProducerItemRes>(
        `https://api.bgm.tv/v0/persons/${id}`,
      ),
    )
    const results = await Promise.all(promises)
    producersData.push(...results)
    return producersData
  }

  private async fetchDataFromVNDB(
    v_id: string,
    finalGameData: GameData,
    finalCharactersData: GameCharacter[],
    finalProducersData: GameDeveloper[],
  ) {
    const [rawGameData, rawReleasesData] = await Promise.all([
      await this.vndbService.vndbRequest<VNDBGameItemRes>(
        'single',
        ['id', '=', v_id],
        [
          'id',
          'titles{title,lang,latin,main}',
          'aliases',
          'description',
          'olang',
          'platforms',
          'image{url}',
          'screenshots{url}',
          'va.character{id,aliases,description,name,original,image{url},gender,vns{role}}',
          'developers{id,name,original,aliases,type,description,extlinks{url,label,name}}',
        ],
        'vn',
      ),
      await this.vndbService.vndbRequest<VNDBReleaseItemRes>(
        'multiple',
        ['vn', '=', ['id', '=', v_id]],
        ['images{type,photo,id,url,dims}', 'languages{lang,title,latin,mtl}', 'platforms'],
        'release',
        100,
      ),
    ])

    const finalCoversData: GameCover[] = []
    try {
      finalGameData.v_id = rawGameData.id
      for (const title of rawGameData.titles) {
        if (title.lang === 'jp') finalGameData.title_jp = title.title
        if (title.lang === 'zh-Hans') finalGameData.title_zh = title.title
        if (title.lang === 'en') finalGameData.title_en = title.title
      }
      finalGameData.aliases = rawGameData.aliases
      if ((await detectLanguage(rawGameData.description)) === 'en')
        finalGameData.intro_en = rawGameData.description
      finalGameData.images = rawGameData.screenshots.map(s => s.url)
      finalGameData.platform = rawGameData.platforms

      for (const character of rawGameData.va) {
        const characterNameOri = character.character.original
        const characterName = character.character.name
        const existingCharacter = finalCharactersData.find(
          c =>
            this.formatString(c.name_jp) === this.formatString(characterNameOri) ||
            this.formatString(c.name_zh) === this.formatString(characterNameOri) ||
            this.formatString(c.name_en) === this.formatString(characterNameOri) ||
            this.formatString(c.name_jp) === this.formatString(characterName) ||
            this.formatString(c.name_zh) === this.formatString(characterName) ||
            this.formatString(c.name_en) === this.formatString(characterName),
        )
        if (existingCharacter) {
          existingCharacter.v_id = character.character.id
          existingCharacter.name_en = characterName
          existingCharacter.intro_en = character.character.description
          if (existingCharacter.aliases)
            existingCharacter.aliases.push(...character.character.aliases)
          else existingCharacter.aliases = character.character.aliases
          existingCharacter.aliases = existingCharacter.aliases.filter(
            (alias, index, self) => self.indexOf(alias) === index,
          )
        } else {
          finalCharactersData.push({
            v_id: character.character.id,
            name_en: characterName,
            name_jp: characterNameOri,
            name_zh: characterNameOri,
          })
        }
      }

      for (const producer of rawGameData.developers) {
        const producerName = producer.name
        const producerNameOri = producer.original
        const existingProducer = finalProducersData.find(
          p =>
            this.formatString(p.name) === this.formatString(producerNameOri) ||
            this.formatString(p.name) === this.formatString(producerName),
        )
        if (existingProducer) {
          existingProducer.v_id = producer.id
          existingProducer.name = producerNameOri || producerName
          existingProducer.intro_en = producer.description
          if (existingProducer.aliases) existingProducer.aliases.push(...producer.aliases)
          else existingProducer.aliases = producer.aliases
          existingProducer.aliases = existingProducer.aliases.filter(
            (alias, index, self) => self.indexOf(alias) === index,
          )
        } else {
          finalProducersData.push({
            v_id: producer.id,
            name: producerNameOri,
            intro_en: producer.description,
            aliases: producer.aliases,
          })
        }
      }

      const allowedImageTypes = new Set(['pkgfront', 'dig'])
      const filteredRawReleasesData = rawReleasesData.filter(r =>
        r.images?.some(i => allowedImageTypes.has(i.type)),
      )

      const pkgfronts: GameCover[] = []
      const digs: GameCover[] = []
      for (const release of filteredRawReleasesData) {
        for (const image of release.images) {
          if (!allowedImageTypes.has(image.type)) continue
          if (image.type === 'pkgfront')
            pkgfronts.push({
              language: image.languages?.[0] || release.languages[0].lang,
              type: image.type,
              url: image.url,
              dims: image.dims,
            })
          else
            digs.push({
              language: image.languages?.[0] || release.languages[0].lang,
              type: image.type,
              url: image.url,
              dims: image.dims,
            })
        }
      }

      const zh_digs = digs.filter(d => d.language?.includes('zh'))
      const en_digs = digs.filter(d => d.language?.includes('en'))
      const jp_digs = digs.filter(d => d.language?.includes('ja'))
      const zh_pkgfronts = pkgfronts.filter(p => p.language?.includes('zh'))
      const en_pkgfronts = pkgfronts.filter(p => p.language?.includes('en'))
      const jp_pkgfronts = pkgfronts.filter(p => p.language?.includes('ja'))
      const isHasCover = {
        zh: false,
        en: false,
        jp: false,
      }

      let index = 1
      for (const zh_d of zh_digs) {
        if (zh_digs.length === 1) {
          isHasCover.zh = true
          finalCoversData.push(zh_d)
          index = 1
          break
        }
        if (index === zh_digs.length && zh_digs.length > 1) {
          isHasCover.zh = true
          finalCoversData.push(zh_d)
          index = 1
        }
        if (zh_d.dims[0] / zh_d.dims[1] <= 0.8) {
          isHasCover.zh = true
          finalCoversData.push(zh_d)
          index = 1
          break
        }
        index++
      }
      for (const en_d of en_digs) {
        if (en_digs.length === 1) {
          isHasCover.en = true
          finalCoversData.push(en_d)
          index = 1
          break
        }
        if (index === en_digs.length && en_digs.length > 1) {
          isHasCover.en = true
          finalCoversData.push(en_d)
          index = 1
        }
        if (en_d.dims[0] / en_d.dims[1] <= 0.8) {
          isHasCover.en = true
          finalCoversData.push(en_d)
          index = 1
          break
        }
        index++
      }
      for (const jp_d of jp_digs) {
        if (jp_digs.length === 1) {
          isHasCover.jp = true
          finalCoversData.push(jp_d)
          index = 1
          break
        }
        if (index === jp_digs.length && jp_digs.length > 1) {
          isHasCover.jp = true
          finalCoversData.push(jp_d)
          index = 1
        }
        if (jp_d.dims[0] / jp_d.dims[1] <= 0.8) {
          isHasCover.jp = true
          finalCoversData.push(jp_d)
          index = 1
          break
        }
        index++
      }

      for (const zh_p of zh_pkgfronts) {
        if (index === zh_pkgfronts.length && zh_pkgfronts.length > 1 && !isHasCover.zh) {
          finalCoversData.push(zh_p)
          index = 1
        }
        if (zh_p.dims[0] / zh_p.dims[1] <= 0.8 && !isHasCover.zh) {
          finalCoversData.push(zh_p)
          index = 1
          break
        }
        index++
      }
      for (const en_p of en_pkgfronts) {
        if (index === en_pkgfronts.length && en_pkgfronts.length > 1 && !isHasCover.en) {
          finalCoversData.push(en_p)
          index = 1
        }
        if (en_p.dims[0] / en_p.dims[1] <= 0.8 && !isHasCover.en) {
          finalCoversData.push(en_p)
          index = 1
          break
        }
        index++
      }
      for (const jp_p of jp_pkgfronts) {
        if (index === jp_pkgfronts.length && jp_pkgfronts.length > 1 && !isHasCover.jp) {
          finalCoversData.push(jp_p)
        }
        if (jp_p.dims[0] / jp_p.dims[1] <= 0.8 && !isHasCover.jp) {
          finalCoversData.push(jp_p)
          break
        }
        index++
      }
    } catch (error) {
      console.error(error)
      throw error
    }

    return { finalGameData, finalCharactersData, finalProducersData, finalCoversData }
  }

  private formatString(str: string | undefined) {
    if (!str) return ''
    return str
      .replace(/[\n\r\t]/g, '')
      .replace(/\s*/g, '')
      .trim()
      .toLowerCase()
  }
}
