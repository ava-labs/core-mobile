import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { LogoModal } from 'common/components/LogoModal'
import { Stack } from 'common/components/Stack'
import {
  modalScreensOptions,
  stackNavigatorScreenOptions,
  stackScreensOptions
} from 'common/consts/screenOptions'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { useBgDetect } from 'common/hooks/useBgDetect'
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import { GlobalAlertWithTextInput } from 'common/utils/alertWithTextInput'
import { GlobalToast } from 'common/utils/toast'
import { useFocusEffect } from 'expo-router'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import { NavigationRedirect } from 'new/common/components/NavigationRedirect'
import React, { useCallback, useEffect, useState } from 'react'
import { Platform, Appearance as RnAppearance } from 'react-native'
import Bootsplash from 'react-native-bootsplash'
import { SystemBars } from 'react-native-edge-to-edge'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import 'react-native-reanimated'
import { useDispatch, useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  Appearance,
  selectSelectedAppearance,
  selectSelectedColorScheme,
  setSelectedColorScheme
} from 'store/settings/appearance'

export default function Root(): JSX.Element | null {
  const dispatch = useDispatch()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const { inBackground } = useBgDetect()
  const [enabledPrivacyScreen, setEnabledPrivacyScreen] = useState(false)
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

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        setEnabledPrivacyScreen(inBackground)
      }, DELAY)
    }, [inBackground])
  )

  useEffect(() => {
    Bootsplash.hide()
  }, [])

  const walletState = useSelector(selectWalletState)

  return (
    <KeyboardProvider>
      <GestureHandlerRootView>
        <K2AlpineThemeProvider colorScheme={colorScheme}>
          <NavigationThemeProvider>
            <RecoveryMethodProvider>
              <NavigationRedirect />
              <Stack
                initialRouteName={
                  walletState === WalletState.ACTIVE
                    ? '(signedIn)'
                    : walletState === WalletState.INACTIVE
                    ? 'loginWithPinOrBiometry'
                    : 'signup'
                }
                screenOptions={stackNavigatorScreenOptions}>
                <Stack.Screen name="signup" options={{ animation: 'none' }} />
                <Stack.Screen
                  name="accessWallet"
                  options={stackScreensOptions}
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
                    presentation: 'fullScreenModal',
                    animation: 'none',
                    headerShown: false,
                    gestureEnabled: false
                  }}
                />
                <Stack.Screen
                  name="forgotPin"
                  options={{ headerShown: true }}
                />
                <Stack.Screen name="+not-found" />
                <Stack.Screen name="onboarding" options={stackScreensOptions} />
                <Stack.Screen
                  name="sessionExpired"
                  options={{
                    ...modalScreensOptions,
                    gestureEnabled: false
                  }}
                />
              </Stack>
              {enabledPrivacyScreen && <LogoModal />}
            </RecoveryMethodProvider>
          </NavigationThemeProvider>
          <GlobalToast />
          <GlobalAlertWithTextInput />
        </K2AlpineThemeProvider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  )
}

const DELAY = Platform.OS === 'android' ? 0 : 100
