import { useCallback, useEffect, useState } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'
import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { GlobalToast } from 'common/utils/toast'
import { selectIsReady, selectWalletState, WalletState } from 'store/app'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'navigation/useBgDetect'
import { useFocusEffect, useRootNavigationState, useRouter } from 'expo-router'
import { Platform } from 'react-native'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { useNavigation } from '@react-navigation/native'
import { ApplicationContextProvider } from 'contexts/ApplicationContext'
import { StackActions } from '@react-navigation/native'
import { LogoModal } from 'common/components/LogoModal'
import { RecoveryMethodProvider } from 'features/onboarding/contexts/RecoveryMethodProvider'
import {
  forNoAnimation,
  stackNavigatorScreenOptions
} from 'common/consts/screenOptions'
import { OnboardingProvider } from 'features/onboarding/contexts/OnboardingProvider'
import { useLoadFonts } from 'common/hooks/useLoadFonts'

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

  const canGoBackToWallet = navigationState?.routes.some(
    route => route.name === '(signedIn)'
  )

  useLoadFonts()

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
          <RecoveryMethodProvider>
            <OnboardingProvider>
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
              </Stack>
              {enabledPrivacyScreen && <LogoModal />}
            </OnboardingProvider>
          </RecoveryMethodProvider>
        </NavigationThemeProvider>
      </ApplicationContextProvider>
      <GlobalToast />
    </K2AlpineThemeProvider>
  )
}

const DELAY = Platform.OS === 'android' ? 0 : 100
