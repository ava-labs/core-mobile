import { BackendModule, ReadCallback, Services, InitOptions } from 'i18next'
import { isLanguageCode } from 'store/settings/language/types'
import { LOCALES } from './locales'

/**
 * i18next backend that loads a locale's catalog synchronously from the Metro
 * bundle via the require-thunk registry. Replaces i18next-http-backend, which
 * cannot work in RN (no origin to fetch from; remote fetch would be OTA).
 */
export const RequireBackend: BackendModule = {
  type: 'backend',
  init: (
    _services: Services,
    _backendOptions: object,
    _i18nextOptions: InitOptions
  ) => undefined,
  read: (language: string, _namespace: string, callback: ReadCallback) => {
    // i18next may call read() with an arbitrary language string — narrow before
    // indexing the (LanguageCode-keyed) registry.
    const load = isLanguageCode(language) ? LOCALES[language] : undefined
    if (!load) {
      callback(new Error(`i18n: unsupported locale ${language}`), false)
      return
    }
    try {
      callback(null, load())
    } catch (e) {
      // normalize non-Error throwables so i18next always receives an Error shape
      callback(e instanceof Error ? e : new Error(String(e)), false)
    }
  }
}
