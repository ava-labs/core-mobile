import { useCallback, useEffect, useState } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'
import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { GlobalToast } from 'common/utils/toast'
import { useDispatch, useSelector } from 'react-redux'
import { useBgDetect } from 'navigation/useBgDetect'
import { useFocusEffect } from 'expo-router'
import { Platform, StatusBar, Appearance as RnAppearance } from 'react-native'
import { LogoModal } from 'common/components/LogoModal'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import {
  forNoAnimation,
  modalScreensOptions,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import {
  Appearance,
  selectSelectedAppearance,
  selectSelectedColorScheme,
  setSelectedColorScheme
} from 'store/settings/appearance'
import { NavigationRedirect } from 'new/common/components/NavigationRedirect'
import { KeyboardProvider } from 'react-native-keyboard-controller'

export default function Root(): JSX.Element | null {
  const dispatch = useDispatch()
  const selectedAppearance = useSelector(selectSelectedAppearance)
  const { inBackground } = useBgDetect()
  const [enabledPrivacyScreen, setEnabledPrivacyScreen] = useState(false)
  const colorScheme = useSelector(selectSelectedColorScheme)

  useEffect(() => {
    const subscription = RnAppearance.addChangeListener(
      ({ colorScheme: updatedColorSchemes }) => {
        if (selectedAppearance === Appearance.System) {
          dispatch(setSelectedColorScheme(updatedColorSchemes ?? 'light'))
        }
      }
    )
    return () => subscription.remove()
  }, [dispatch, selectedAppearance])

  useEffect(() => {
    StatusBar.setBarStyle(
      colorScheme === 'dark' ? 'light-content' : 'dark-content',
      true
    )
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

  return (
    <K2AlpineThemeProvider colorScheme={colorScheme}>
      <NavigationThemeProvider>
        <KeyboardProvider>
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
              <Stack.Screen name="forgotPin" options={{ headerShown: true }} />
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
            {enabledPrivacyScreen && <LogoModal />}
          </RecoveryMethodProvider>
        </KeyboardProvider>
      </NavigationThemeProvider>
      <GlobalToast />
    </K2AlpineThemeProvider>
  )
}

const DELAY = Platform.OS === 'android' ? 0 : 100
