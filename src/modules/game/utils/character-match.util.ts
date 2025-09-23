const MIN_CONTAIN_LEN = 3

type FinalCharacter = {
  name_jp?: string
  name_en?: string
  name_zh?: string
  aliases?: string[]
  [k: string]: any
}

type RawVNDBCharacter = {
  name?: string | null
  original?: string | null
  aliases?: string[] | null
  [k: string]: any
}

const has = (s?: string | null): s is string => !!(s && String(s).trim())

// 统一规整：NFKC + 去括号内注释 + 去中点/空白/常见标点 + 小写
const norm = (s?: string | null) =>
  (s ?? '')
    .normalize('NFKC')
    .replace(/（.*?）|\(.*?\)/g, '') // 去中/英括号内容
    .replace(/[・·•\s_\-’'".,，、:：;；~～]/g, '') // 去中点、空白、常见标点
    .toLowerCase()
    .trim()

// 宽松包含：处理短名 vs 全名（阈值避免过度匹配）
const containsLoose = (a: string, b: string) =>
  a.length >= MIN_CONTAIN_LEN && b.length >= MIN_CONTAIN_LEN && (a.includes(b) || b.includes(a))

// 从 final item 收集所有可匹配键
const collectFinalKeys = (c: FinalCharacter) => {
  const arr = [c.name_jp, c.name_en, c.name_zh, ...(c.aliases ?? [])].filter(has)
  const raw = arr.map(norm)
  return new Set(raw)
}

// 从 raw 收集所有可匹配键，并标注来源（name/original/alias）
const collectRawKeys = (r: RawVNDBCharacter) => {
  const keys: Array<{ key: string; weight: number }> = []
  if (has(r.name)) keys.push({ key: norm(r.name!), weight: 3 }) // 主名权重高
  if (has(r.original)) keys.push({ key: norm(r.original!), weight: 3 }) // 原文名权重高
  for (const al of r.aliases ?? []) {
    if (has(al)) keys.push({ key: norm(al), weight: 2 })
  }
  // 去重但保留最大权重
  const best = new Map<string, number>()
  for (const { key, weight } of keys) {
    if (!key) continue
    best.set(key, Math.max(best.get(key) ?? 0, weight))
  }
  return Array.from(best.entries()).map(([key, weight]) => ({ key, weight }))
}

// 建立索引：normalizedKey -> FinalCharacter 列表
export const createCharacterMatcher = (finalCharactersData: FinalCharacter[]) => {
  const index = new Map<string, FinalCharacter[]>()

  // 预处理：为每个 final 角色收集键并入索引
  const finalItemsWithKeys = finalCharactersData.map(item => {
    const keys = collectFinalKeys(item)
    for (const k of keys) {
      if (!k) continue
      const bucket = index.get(k)
      if (bucket) bucket.push(item)
      else index.set(k, [item])
    }
    return { item, keys }
  })

  // 精确命中后打分选择；无命中则做包含式兜底
  const match = (rawChar: RawVNDBCharacter): FinalCharacter | undefined => {
    const rawKeys = collectRawKeys(rawChar)
    const score = new Map<FinalCharacter, { s: number; bestKeyLen: number }>()

    // 1) 先用索引做“规整后精确匹配”
    for (const { key, weight } of rawKeys) {
      const bucket = index.get(key)
      if (!bucket) continue
      for (const cand of bucket) {
        const prev = score.get(cand) ?? { s: 0, bestKeyLen: 0 }
        const next = { s: prev.s + weight, bestKeyLen: Math.max(prev.bestKeyLen, key.length) }
        score.set(cand, next)
      }
    }

    if (score.size > 0) {
      // 选最高分；分数相同则选匹配键更长者（更具体）
      let best: FinalCharacter | undefined
      let bestS = -1
      let bestLen = -1
      for (const [cand, v] of score.entries()) {
        if (v.s > bestS || (v.s === bestS && v.bestKeyLen > bestLen)) {
          best = cand
          bestS = v.s
          bestLen = v.bestKeyLen
        }
      }
      return best
    }

    // 2) 兜底：短名/全名的宽松包含（避免 O(n^2) 的过度比较，仅当精确未命中时）
    let looseBest: { cand: FinalCharacter; hitLen: number } | undefined
    for (const { item, keys } of finalItemsWithKeys) {
      for (const a of keys) {
        for (const { key: b } of rawKeys) {
          if (!a || !b) continue
          if (containsLoose(a, b)) {
            const hitLen = Math.min(a.length, b.length)
            if (!looseBest || hitLen > looseBest.hitLen) {
              looseBest = { cand: item, hitLen }
            }
          }
        }
      }
    }
    return looseBest?.cand
  }

  return match
}
