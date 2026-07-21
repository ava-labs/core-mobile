export type Language = {
  code: string
  name: string // English name
  nativeName: string
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English', nativeName: 'English' },
  { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
  { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
  { code: 'fr-FR', name: 'French', nativeName: 'Français' },
  { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
  { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
  { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
  { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
  { code: 'tr-TR', name: 'Turkish', nativeName: 'Türkçe' }
]

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map(l => l.code)

export const DEFAULT_LANGUAGE = 'en-US'

/** Non-encrypted MMKV key holding the persisted language for the synchronous bootstrap seed. */
export const LANGUAGE_MMKV_KEY = 'language'

export const initialState = {
  selected: DEFAULT_LANGUAGE
}

export type LanguageState = {
  selected: string
}
