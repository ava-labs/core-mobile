import { AppStartListening } from 'store/middleware/listener'
import { AnyAction } from '@reduxjs/toolkit'
import { Appearance as RnAppearance } from 'react-native'
import { AppListenerEffectAPI } from 'store'
import { selectIsDeveloperMode, toggleDeveloperMode } from '../advanced'
import { selectSelectedAppearance, setSelectedAppearance } from './slice'
import { Appearance } from './types'

const handleAppearanceChange = (action: AnyAction): void => {
  RnAppearance.setColorScheme(
    action.payload === Appearance.Light
      ? 'light'
      : action.payload === Appearance.Dark
      ? 'dark'
      : null
  )
}

const handleTestnetModeAppearanceChange = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { getState } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const appearance = selectSelectedAppearance(state)

  RnAppearance.setColorScheme(
    isDeveloperMode || appearance === Appearance.Dark
      ? 'dark'
      : appearance === Appearance.Light
      ? 'light'
      : null
  )
}

export const addAppearanceListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: setSelectedAppearance,
    effect: handleAppearanceChange
  })

  startListening({
    actionCreator: toggleDeveloperMode,
    effect: handleTestnetModeAppearanceChange
  })
}
