import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import SentryService from 'services/sentry/SentryService'
import { commonStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'
import {
  DEFAULT_LANGUAGE,
  isLanguageCode,
  LANGUAGE_MMKV_KEY,
  LanguageCode,
  SUPPORTED_LANGUAGE_CODES
} from 'store/settings/language/types'
import { RequireBackend } from './backend'
import { LOCALES } from './locales'

/**
 * Load the active locale's catalog explicitly — rather than inlining
 * `LOCALES[lng]?.() ?? {}` — so a broken active catalog is *observable* at cold
 * start instead of silently seeding an all-keys UI in the user's language:
 *  - a throwing thunk (corrupt bundled JSON / bad OTA update) is caught, not
 *    left to escape as an opaque bootstrap crash;
 *  - a missing/empty catalog is reported instead of rendering raw i18n keys.
 *
 * Reported via `SentryService` directly (with an `errorId` tag), because at this
 * point in bootstrap `Logger.error` does not yet forward to Sentry — that only
 * arms later — so a cold-start i18n failure would otherwise be logged nowhere in
 * release. `Logger.error` is kept for dev-console visibility.
 */
const loadActiveCatalog = (lng: LanguageCode): Record<string, string> => {
  let catalog: Record<string, string> = {}
  try {
    catalog = LOCALES[lng]()
  } catch (err) {
    const message = `[i18n] active locale catalog threw for ${lng}`
    Logger.error(message, err)
    SentryService.captureException(message, {
      value: err,
      tags: { errorId: 'i18n_catalog_load_failed', locale: lng }
    })
    return {}
  }
  if (Object.keys(catalog).length === 0) {
    const message = `[i18n] active locale catalog empty/missing for ${lng}`
    Logger.error(message)
    SentryService.captureException(message, {
      tags: { errorId: 'i18n_catalog_empty', locale: lng }
    })
  }
  return catalog
}

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
  const lng: LanguageCode =
    stored && isLanguageCode(stored) ? stored : DEFAULT_LANGUAGE

  return i18n
    .use(RequireBackend)
    .use(initReactI18next)
    .init({
      lng,
      // force synchronous init so i18n.language + the active-locale resources
      // are ready by the time init() returns (before registerComponent / first
      // render) — the inline `resources` and the synchronous RequireBackend
      // both resolve without a tick, so no async gap / no cold-start flash.
      // (`initImmediate` was renamed to `initAsync` in i18next v24; v26 only
      // removed the deprecated `initImmediate` alias.)
      initAsync: false,
      fallbackLng: DEFAULT_LANGUAGE,
      supportedLngs: [...SUPPORTED_LANGUAGE_CODES],
      load: 'currentOnly',
      keySeparator: false,
      nsSeparator: false,
      partialBundledLanguages: true,
      interpolation: { escapeValue: false },
      returnNull: false,
      // No Suspense boundary wraps the tree; keep useTranslation synchronous
      // so a consumer mounting before a namespace resolves never throws.
      react: { useSuspense: false },
      resources: { [lng]: { translation: loadActiveCatalog(lng) } }
    })
}

export { default as i18n } from 'i18next'
