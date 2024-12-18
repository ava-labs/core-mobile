import { useCallback, useEffect, useState } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'

import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'new/components/navigation/Stack'
import NavigationThemeProvider from 'new/utils/navigation/NavigationThemeProvider'
import { GlobalToast } from 'new/utils/toast'
import { stackNavigatorScreenOptions } from 'new/utils/navigation/screenOptions'
import { selectIsReady, selectWalletState, WalletState } from 'store/app'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'navigation/useBgDetect'
import {
  useFocusEffect,
  useNavigation,
  useRootNavigationState,
  useRouter
} from 'expo-router'
import { Platform } from 'react-native'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import { StackActions } from '@react-navigation/native'
import { LogoModal } from 'new/components/LogoModal'
import { SignupProvider } from 'new/contexts/SignupProvider'

export default function RootLayout(): JSX.Element | null {
  const router = useRouter()
  const navigation = useNavigation()
  const { inBackground } = useBgDetect()
  const walletState = useSelector(selectWalletState)
  const appIsReady = useSelector(selectIsReady)
  const [shouldRenderOnlyPinScreen, setShouldRenderOnlyPinScreen] = useState<
    null | boolean
  >(null)
  const [enabledPrivacyScreen, setEnabledPrivacyScreen] = useState(false)
  const navigationState = useRootNavigationState()

  const canGoBackToWallet = navigationState.routes.some(
    route => route.name === '(signedIn)'
  )

  useEffect(() => {
    if (walletState === WalletState.NONEXISTENT) {
      if (router.canGoBack()) {
        navigation.dispatch(StackActions.popToTop())
      }
      router.replace('/signup')
    } else if (walletState === WalletState.INACTIVE) {
      // Navigate to login modal when walletState is not active
      router.navigate('/loginWithPinOrBiometry')
    } else if (walletState === WalletState.ACTIVE) {
      if (canGoBackToWallet && router.canGoBack()) {
        router.back()
      } else {
        router.replace('/portfolio')
      }
    }
  }, [walletState, router, canGoBackToWallet, navigation])

  useEffect(() => {
    // set shouldRenderOnlyPinScreen to false once wallet is unlocked
    // do nothing if app is not ready (as we need to sync wallet state after rehydration)
    // or if we have already set shouldRenderOnlyPinScreen to false
    if (!appIsReady || shouldRenderOnlyPinScreen === false) return

    setShouldRenderOnlyPinScreen(walletState !== WalletState.ACTIVE)
  }, [appIsReady, shouldRenderOnlyPinScreen, walletState])

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
    <K2AlpineThemeProvider>
      <ApplicationContextProvider>
        <NavigationThemeProvider>
          <SignupProvider>
            <Stack screenOptions={stackNavigatorScreenOptions}>
              <Stack.Screen
                name="index"
                options={{ animationEnabled: false }}
              />
              <Stack.Screen
                name="signup"
                options={{ animationEnabled: false }}
              />
              <Stack.Screen name="accessWallet" />
              <Stack.Screen
                name="(signedIn)"
                options={{
                  headerShown: false,
                  animationEnabled: false,
                  gestureEnabled: false
                }}
              />
              <Stack.Screen
                name="loginWithPinOrBiometry"
                options={{
                  presentation: 'modal',
                  headerShown: false,
                  gestureEnabled: false,
                  animationEnabled: false
                }}
              />
              <Stack.Screen name="forgotPin" />
              <Stack.Screen name="+not-found" />
            </Stack>
            {enabledPrivacyScreen && <LogoModal />}
          </SignupProvider>
        </NavigationThemeProvider>
      </ApplicationContextProvider>
      <GlobalToast />
    </K2AlpineThemeProvider>
  )
}

const DELAY = Platform.OS === 'android' ? 0 : 100
