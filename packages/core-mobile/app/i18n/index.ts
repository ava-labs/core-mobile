import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { commonStorage } from 'utils/mmkv/storages'
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_MMKV_KEY,
  SUPPORTED_LANGUAGE_CODES
} from 'store/settings/language/types'
import { RequireBackend } from './backend'
import { LOCALES } from './locales'

/**
 * Initialize i18next synchronously at the top of app bootstrap. Reads the
 * persisted language from the non-encrypted MMKV cache (Redux is encrypted and
 * async-rehydrated, so unreadable this early) and seeds the active locale
 * inline as `resources` so the first render is already translated — no
 * English→translated flash. Non-active locales load lazily via RequireBackend
 * on changeLanguage (partialBundledLanguages keeps the backend in play).
 */
export const initI18n = (): Promise<unknown> => {
  const stored = commonStorage.getString(LANGUAGE_MMKV_KEY)
  const lng =
    stored && SUPPORTED_LANGUAGE_CODES.includes(stored)
      ? stored
      : DEFAULT_LANGUAGE

  return i18n
    .use(RequireBackend)
    .use(initReactI18next)
    .init({
      lng,
      // force synchronous init so i18n.language + the active-locale resources
      // are ready by the time init() returns (before registerComponent / first
      // render) — the inline `resources` and the synchronous RequireBackend
      // both resolve without a tick, so no async gap / no cold-start flash.
      // (v26 renamed the old `initImmediate` option to `initAsync`.)
      initAsync: false,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: SUPPORTED_LANGUAGE_CODES,
      load: 'currentOnly',
      keySeparator: false,
      nsSeparator: false,
      partialBundledLanguages: true,
      interpolation: { escapeValue: false },
      returnNull: false,
      // No Suspense boundary wraps the tree; keep useTranslation synchronous
      // so a consumer mounting before a namespace resolves never throws.
      react: { useSuspense: false },
      resources: { [lng]: { translation: LOCALES[lng]?.() ?? {} } }
    })
}

export { default as i18n } from 'i18next'
