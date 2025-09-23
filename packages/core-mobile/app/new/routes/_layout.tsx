import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import { GlobalAlertWithTextInput } from 'common/utils/alertWithTextInput'
import { GlobalToast } from 'common/utils/toast'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { PrivacyScreen } from 'features/privacyScreen/components/PrivacyScreen'
import React, { useEffect } from 'react'
import { Appearance as RnAppearance } from 'react-native'
import Bootsplash from 'react-native-bootsplash'
import { SystemBars } from 'react-native-edge-to-edge'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import {
  Appearance,
  selectSelectedAppearance,
  selectSelectedColorScheme,
  setSelectedColorScheme
} from 'store/settings/appearance'
import { RootNavigator } from './RootNavigator'

export default function Root(): JSX.Element | null {
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const colorScheme = useSelector(selectSelectedColorScheme)

  useEffect(() => {
    const subscription = RnAppearance.addChangeListener(
      ({ colorScheme: updatedColorSchemes }) => {
        if (selectedAppearance === Appearance.System && !isDeveloperMode) {
          dispatch(setSelectedColorScheme(updatedColorSchemes ?? 'light'))
          SystemBars.setStyle(updatedColorSchemes === 'dark' ? 'light' : 'dark')
        }
      }
    )
    return () => subscription.remove()
  }, [dispatch, isDeveloperMode, selectedAppearance])

  useEffect(() => {
    SystemBars.setStyle(colorScheme === 'dark' ? 'light' : 'dark')
  }, [colorScheme])

  useLoadFonts()

  useEffect(() => {
    Bootsplash.hide()
  }, [])

  return (
    <KeyboardProvider>
      <GestureHandlerRootView>
        <K2AlpineThemeProvider colorScheme={colorScheme}>
          <NavigationThemeProvider>
            <DeeplinkContextProvider>
              <RecoveryMethodProvider>
                <RootNavigator />
                <PrivacyScreen />
              </RecoveryMethodProvider>
            </DeeplinkContextProvider>
          </NavigationThemeProvider>
          <GlobalToast />
          <GlobalAlertWithTextInput />
        </K2AlpineThemeProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  )
}
