export const detectLanguage = async (input: string): Promise<'jp' | 'zh' | 'en' | 'unknown'> => {
  const { franc } = await import('franc')
  const languageCode = franc(input)
  switch (languageCode) {
    case 'jpn':
      return 'jp'
    case 'zho':
    case 'cmn':
      return 'zh'
    case 'eng':
      return 'en'
    default:
      return 'unknown'
  }
}
