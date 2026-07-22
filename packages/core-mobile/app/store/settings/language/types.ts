export type Language = {
  code: string
  name: string // English name
  nativeName: string
}

export const SUPPORTED_LANGUAGES = [
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
] as const

/**
 * The closed set of locale codes, derived from `SUPPORTED_LANGUAGES` so it can
 * never drift from that list or from `LOCALES` (which is typed
 * `Record<LanguageCode, …>`). Add a locale in one place → compile error until
 * the others match. (Kept as plain `as const` rather than `as const satisfies
 * readonly Language[]` because the repo's prettier 2.6.2 can't parse that
 * chain; the entries still structurally match `Language`.)
 */
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']

export const SUPPORTED_LANGUAGE_CODES: readonly LanguageCode[] =
  SUPPORTED_LANGUAGES.map(l => l.code)

export const DEFAULT_LANGUAGE: LanguageCode = 'en-US'

/**
 * Runtime narrowing for the genuinely untrusted boundaries where a bare `string`
 * arrives — the MMKV bootstrap seed, redux-persist rehydration (selector read),
 * and i18next calling the backend `read` with an arbitrary language. Lets those
 * sites narrow to `LanguageCode` instead of re-widening to `string`.
 */
export const isLanguageCode = (value: string): value is LanguageCode =>
  (SUPPORTED_LANGUAGE_CODES as readonly string[]).includes(value)

/** Non-encrypted MMKV key holding the persisted language for the synchronous bootstrap seed. */
export const LANGUAGE_MMKV_KEY = 'language'

export type LanguageState = {
  selected: LanguageCode
}

export const initialState: LanguageState = {
  selected: DEFAULT_LANGUAGE
}
