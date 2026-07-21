type Catalog = Record<string, string>

/**
 * Static map of per-locale require-thunks. All 11 JSON files are bundled by
 * Metro, but each `require` only executes (parses into the JS heap) when its
 * thunk is called — so non-active locales are never loaded. Requires must be
 * literal (not computed) for Metro to bundle them.
 */
export const LOCALES: Record<string, () => Catalog> = {
  'en-US': () => require('./locales/en-US/translation.json'),
  'zh-CN': () => require('./locales/zh-CN/translation.json'),
  'zh-TW': () => require('./locales/zh-TW/translation.json'),
  'fr-FR': () => require('./locales/fr-FR/translation.json'),
  'de-DE': () => require('./locales/de-DE/translation.json'),
  'hi-IN': () => require('./locales/hi-IN/translation.json'),
  'ja-JP': () => require('./locales/ja-JP/translation.json'),
  'ko-KR': () => require('./locales/ko-KR/translation.json'),
  'ru-RU': () => require('./locales/ru-RU/translation.json'),
  'es-ES': () => require('./locales/es-ES/translation.json'),
  'tr-TR': () => require('./locales/tr-TR/translation.json')
}
