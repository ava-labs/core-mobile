import i18n from 'i18next'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { commonStorage } from 'utils/mmkv/storages'
import { setSelectedLanguage } from './slice'
import { LANGUAGE_MMKV_KEY } from './types'

export const handleLanguageChange = (
  action: ReturnType<typeof setSelectedLanguage>,
  _listenerApi: AppListenerEffectAPI
): void => {
  const code = action.payload
  // write-through to the synchronous bootstrap cache (Redux stays the
  // official persisted preference; this is what the cold-start seed reads)
  commonStorage.set(LANGUAGE_MMKV_KEY, code)
  // drive the runtime re-render
  i18n.changeLanguage(code)
}

export const addLanguageListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: setSelectedLanguage,
    effect: handleLanguageChange
  })
}
