import i18n from 'i18next'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { commonStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'
import { selectSelectedLanguage, setSelectedLanguage } from './slice'
import { LANGUAGE_MMKV_KEY } from './types'

export const handleLanguageChange = (
  _action: ReturnType<typeof setSelectedLanguage>,
  listenerApi: AppListenerEffectAPI
): void => {
  // derive the effective (validated/clamped) code from state rather than the
  // raw action payload, so an unsupported code can never be persisted or loaded
  const code = selectSelectedLanguage(listenerApi.getState())
  // write-through to the synchronous bootstrap cache (Redux stays the
  // official persisted preference; this is what the cold-start seed reads)
  commonStorage.set(LANGUAGE_MMKV_KEY, code)
  // drive the runtime re-render; catch so a failed locale load (should be
  // impossible for bundled JSON) is logged rather than an unhandled rejection
  i18n
    .changeLanguage(code)
    .catch(err => Logger.error(`[i18n] changeLanguage(${code}) failed`, err))
}

export const addLanguageListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: setSelectedLanguage,
    effect: handleLanguageChange
  })
}
