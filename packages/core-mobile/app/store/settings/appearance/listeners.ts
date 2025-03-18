import { AppStartListening } from 'store/middleware/listener'
import { AnyAction } from '@reduxjs/toolkit'
import { Appearance as RnAppearance } from 'react-native'
import { setSelectedAppearance } from './slice'
import { Appearance } from './types'

const toggleAppearanceSideEffect = (action: AnyAction): void => {
  RnAppearance.setColorScheme(
    action.payload === Appearance.Light
      ? 'light'
      : action.payload === Appearance.Dark
      ? 'dark'
      : null
  )
}

export const addAppearanceListeners = (
  startListening: AppStartListening
): void => {
  startListening({
    actionCreator: setSelectedAppearance,
    effect: toggleAppearanceSideEffect
  })
}
