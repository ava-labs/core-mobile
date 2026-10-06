import { AnyAction, isAnyOf } from '@reduxjs/toolkit'
import { setThemePreference } from '@vonovak/react-native-theme-control'
import { Appearance as RnAppearance } from 'react-native'
import { onRehydrationComplete } from 'store/app'
import { AppListenerEffectAPI, AppStartListening } from 'store/types'
import { selectIsDeveloperMode, toggleDeveloperMode } from '../advanced'
import {
  selectSelectedAppearance,
  selectSelectedColorScheme,
  setSelectedAppearance,
  setSelectedColorScheme
} from './slice'
import { Appearance, ColorSchemeName } from './types'

export const handleAppearanceChange = (
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

  // Developer (testnet) mode forces the JS color scheme to dark above, so the
  // native night mode has to be forced with it. Leaving it on the user's
  // appearance makes Android draw native surfaces light while React draws dark
  // - most visibly the formSheet modals, whose sheet background is native
  // chrome we can't paint from JS, so it showed through as a white header.
  if (isDeveloperMode) {
    setThemePreference('dark')
  } else {
    switch (appearance) {
      case Appearance.System:
        setThemePreference('system')
        break
      case Appearance.Dark:
        setThemePreference('dark')
        break
      case Appearance.Light:
        setThemePreference('light')
        break
    }
  }

  if (currentColorScheme !== colorScheme) {
    dispatch(setSelectedColorScheme(colorScheme))
  }
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
