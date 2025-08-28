import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import {
  forNoAnimation,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import { useModalScreenOptions } from 'common/hooks/useModalScreenOptions'
import { GlobalAlertWithTextInput } from 'common/utils/alertWithTextInput'
import { GlobalToast } from 'common/utils/toast'
import { DeeplinkContextProvider } from 'contexts/DeeplinkContext/DeeplinkContext'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { NavigationRedirect } from 'new/common/components/NavigationRedirect'
import React, { useEffect } from 'react'
import { Appearance as RnAppearance } from 'react-native'
import Bootsplash from 'react-native-bootsplash'
import { SystemBars } from 'react-native-edge-to-edge'
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
import { PrivacyScreen } from 'features/privacyScreen/components/PrivacyScreen'

export default function Root(): JSX.Element | null {
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const colorScheme = useSelector(selectSelectedColorScheme)

  const { modalScreensOptions } = useModalScreenOptions()

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
      <K2AlpineThemeProvider colorScheme={colorScheme}>
        <NavigationThemeProvider>
          <DeeplinkContextProvider>
            <RecoveryMethodProvider>
              <NavigationRedirect />
              <Stack
                screenOptions={{
                  ...stackNavigatorScreenOptions,
                  headerShown: false
                }}>
                <Stack.Screen name="index" options={{ animation: 'none' }} />
                <Stack.Screen name="signup" options={{ animation: 'none' }} />
                <Stack.Screen
                  name="accessWallet"
                  options={{ headerShown: true }}
                />
                <Stack.Screen
                  name="(signedIn)"
                  options={{
                    headerShown: false,
                    animation: 'none',
                    gestureEnabled: false
                  }}
                />
                <Stack.Screen
                  name="loginWithPinOrBiometry"
                  options={{
                    presentation: 'modal',
                    headerShown: false,
                    gestureEnabled: false,
                    cardStyleInterpolator: forNoAnimation
                  }}
                />
                <Stack.Screen
                  name="forgotPin"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="onboarding" />
                <Stack.Screen
                  name="sessionExpired"
                  options={{
                    ...modalScreensOptions,
                    gestureEnabled: false
                  }}
                />
              </Stack>
              <PrivacyScreen />
            </RecoveryMethodProvider>
          </DeeplinkContextProvider>
        </NavigationThemeProvider>
        <GlobalToast />
        <GlobalAlertWithTextInput />
      </K2AlpineThemeProvider>
    </KeyboardProvider>
  )
}
