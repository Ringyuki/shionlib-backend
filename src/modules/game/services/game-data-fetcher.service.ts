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
import { GameCharacter, GameData, GameDeveloper } from '../interfaces/game.interface'

@Injectable()
export class GameDataFetcherService {
  constructor(private readonly bangumiService: BangumiAuthService) {}

  async fetchDatafromBangumi(b_id: string, v_id?: string) {
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

    const characterIds = rawCharacterData.map(c => c.id)
    const producerids = rawPersonData.filter(p => p.relation === '开发').map(p => p.id)

    const [rawFullCharactersData, rawFullProducersData] = await Promise.all([
      this.fetchRawFullCharactersDataFromBangumi(characterIds),
      this.fetchRawFullProducersDataFromBangumi(producerids),
    ])

    const finalGameData: GameData = {} as GameData
    finalGameData.b_id = rawGameData.id.toString()
    if ((await detectLanguage(rawGameData.name)) === 'en') finalGameData.title_en = rawGameData.name
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

    const finalCharactersData: GameCharacter[] = []
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
      const rawFullCharacterData = rawFullCharactersData.find(c => String(c.id) === character.b_id)
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
          else for (const a of rawAliases.value as InfoboxValueArray[]) character.aliases.push(a.v)
        }
        character.extra_info = rawFullCharacterData.infobox
          .filter(i => !['简体中文名', '别名'].includes(i.key))
          .map(i => ({
            key: i.key,
            value: typeof i.value === 'string' ? i.value : i.value.map(v => v.v).join(', '),
          }))
      }
    }

    const finalProducersData: GameDeveloper[] = []
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

  async fetchDataFromVNDB(
    v_id: string,
    finalGameData: GameData,
    finalCharactersData: GameCharacter[],
    finalProducersData: GameDeveloper[],
  ) {
    return { finalGameData, finalCharactersData, finalProducersData }
  }
}
