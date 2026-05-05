import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { isLimitedMode } from 'utils/limitedMode'
import { FloatingDevTools } from 'common/containers/FloatingDevTools'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import { useNoInternetToast } from 'common/hooks/useNoInternetToast'
import { GlobalAlertWithTextInput } from 'common/utils/alertWithTextInput'
import { GlobalToast } from 'common/utils/toast'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { setStatusBarStyle } from 'expo-status-bar'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { PrivacyScreen } from 'features/privacyScreen/components/PrivacyScreen'
import React, { useEffect } from 'react'
import { Appearance as RnAppearance } from 'react-native'
import Bootsplash from 'react-native-bootsplash'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
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
          setStatusBarStyle(updatedColorSchemes === 'dark' ? 'light' : 'dark')
        }
      }
    )
    return () => subscription.remove()
  }, [dispatch, isDeveloperMode, selectedAppearance])

  // Sync the active colorScheme with the user's appearance pick. Without
  // this the theme provider only updates when the system theme changes,
  // so picking "Light" or "Dark" explicitly in-app had no effect.
  useEffect(() => {
    if (selectedAppearance === Appearance.Light) {
      dispatch(setSelectedColorScheme('light'))
    } else if (selectedAppearance === Appearance.Dark) {
      dispatch(setSelectedColorScheme('dark'))
    } else {
      dispatch(
        setSelectedColorScheme(RnAppearance.getColorScheme() ?? 'light')
      )
    }
  }, [dispatch, selectedAppearance])

  useEffect(() => {
    setStatusBarStyle(colorScheme === 'dark' ? 'light' : 'dark')
  }, [colorScheme])

  useLoadFonts()
  useNoInternetToast()

  useEffect(() => {
    Bootsplash.hide()
  }, [])

  return (
    <KeyboardProvider>
      <GestureHandlerRootView>
        <K2AlpineThemeProvider
          colorScheme={colorScheme}
          variant={isLimitedMode ? 'moto' : 'default'}>
          <NavigationThemeProvider>
            <DeeplinkContextProvider>
              <RecoveryMethodProvider>
                <RootNavigator />
                <PrivacyScreen />
              </RecoveryMethodProvider>
            </DeeplinkContextProvider>
          </NavigationThemeProvider>
          {__DEV__ && <FloatingDevTools />}
          <GlobalToast />
          <GlobalAlertWithTextInput />
        </K2AlpineThemeProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  )
}
