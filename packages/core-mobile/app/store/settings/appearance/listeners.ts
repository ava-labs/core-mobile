import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { Appearance as RnAppearance } from 'react-native'
import { onRehydrationComplete } from 'store/app'
import { selectIsDeveloperMode, toggleDeveloperMode } from '../advanced'
import {
  selectSelectedAppearance,
  selectSelectedColorScheme,
  setSelectedAppearance,
  setSelectedColorScheme
} from './slice'
import { Appearance, ColorSchemeName } from './types'

const handleAppearanceChange = (
  _: AnyAction,
  listenerApi: AppListenerEffectAPI
): void => {
  const { getState, dispatch } = listenerApi
  const state = getState()
  const isDeveloperMode = selectIsDeveloperMode(state)
  const appearance = selectSelectedAppearance(state)
  const currentColorScheme = selectSelectedColorScheme(state)
  const colorScheme =
    isDeveloperMode || appearance === Appearance.Dark
      ? 'dark'
      : appearance === Appearance.Light
      ? 'light'
      : (RnAppearance.getColorScheme() as ColorSchemeName)

  currentColorScheme !== colorScheme &&
    dispatch(setSelectedColorScheme(colorScheme))
}

export const addAppearanceListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    matcher: isAnyOf(
      setSelectedAppearance,
      toggleDeveloperMode,
      onRehydrationComplete
    ),
    effect: handleAppearanceChange
  })
}
