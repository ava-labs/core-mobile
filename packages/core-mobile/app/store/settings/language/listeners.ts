import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import i18n from 'i18next'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { commonStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'
import { selectSelectedLanguage, setSelectedLanguage } from './slice'
import { LANGUAGE_MMKV_KEY } from './types'

export const handleLanguageChange = (
  _action: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  // derive the effective (validated/clamped) code from state rather than the
  // raw action payload, so an unsupported code can never be persisted or loaded
  const code = selectSelectedLanguage(listenerApi.getState())
  // write-through to the synchronous bootstrap cache (Redux stays the
  // official persisted preference; this is what the cold-start seed reads)
  commonStorage.set(LANGUAGE_MMKV_KEY, code)
  // drive the runtime re-render; catch so a failed locale load (should be
  // impossible for bundled JSON) is logged rather than an unhandled rejection.
  // The errorId tag lets the (runtime-armed) Sentry forward surface it.
  i18n.changeLanguage(code).catch(err =>
    Logger.error(`[i18n] changeLanguage(${code}) failed`, err, {
      errorId: 'i18n_change_language_failed',
      locale: code
    })
  )
}

export const addLanguageListeners = (
  startListening: AppStartListening
): void => {
  // Also run on onRehydrationComplete (mirroring settings/appearance) so the
  // runtime is reconciled from persisted Redux on every cold start — this makes
  // Redux the authoritative source it's documented to be. If the non-encrypted
  // MMKV seed is ever cleared independently of (encrypted) Redux — storage
  // reset, reinstall-restore paths — the bootstrap seed falls back to en-US but
  // this re-syncs i18n to the real persisted preference once Redux rehydrates.
  startListening({
    matcher: isAnyOf(setSelectedLanguage, onRehydrationComplete),
    effect: handleLanguageChange
  })
}
