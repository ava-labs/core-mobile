import { useCallback, useEffect, useState } from 'react'
import 'react-native-reanimated'
import Bootsplash from 'react-native-bootsplash'
import React from 'react'
import { K2AlpineThemeProvider } from '@avalabs/k2-alpine'
import { Stack } from 'common/components/Stack'
import NavigationThemeProvider from 'common/contexts/NavigationThemeProvider'
import { GlobalToast } from 'common/utils/toast'
import { selectWalletState, WalletState } from 'store/app'
import { useSelector } from 'react-redux'
import { useBgDetect } from 'navigation/useBgDetect'
import {
  useFocusEffect,
  useRootNavigationState,
  useRouter,
  usePathname
} from 'expo-router'
import { Platform, StatusBar } from 'react-native'
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
import { useLoadFonts } from 'common/hooks/useLoadFonts'
import { useColorScheme } from 'common/contexts/ColorSchemeProvider'

export default function Root(): JSX.Element | null {
  const router = useRouter()
  const navigation = useNavigation()
  const pathName = usePathname()
  const { inBackground } = useBgDetect()
  const walletState = useSelector(selectWalletState)

  const [enabledPrivacyScreen, setEnabledPrivacyScreen] = useState(false)
  const navigationState = useRootNavigationState()
  const { colorScheme } = useColorScheme()

  const isSignedIn = navigationState?.routes.some(
    route => route.name === '(signedIn)'
  )

  useEffect(() => {
    StatusBar.setBarStyle(
      colorScheme === 'dark' ? 'light-content' : 'dark-content',
      true
    )
  }, [colorScheme])

  useLoadFonts()

  // please be careful with the dependencies here
  // this effect is responsible for redirecting users
  // to either the sign up flow or the login modal
  // we don't want to include any other dependencies here
  useEffect(() => {
    if (walletState === WalletState.NONEXISTENT) {
      if (router.canGoBack()) {
        navigation.dispatch(StackActions.popToTop())
      }
      router.replace('/signup')
    } else if (walletState === WalletState.INACTIVE) {
      // navigate to login modal when wallet is not active
      router.navigate('/loginWithPinOrBiometry')
    }
  }, [walletState, router, navigation])

  // TODO: refactor this effect so that we don't depend on navigation state
  useEffect(() => {
    /**
     * after the wallet is successfully unlocked
     *
     * - redirect to the portfolio if:
     *   - the app was freshly opened
     *   - the user just completed onboarding
     * - otherwise, return the user to their previous/last screen if the app was locked due to inactivity.
     */
    if (walletState === WalletState.ACTIVE) {
      // when the login modal is the last route and on top of the (signedIn) stack
      // it means the app just resumed from inactivity
      const isReturningFromInactivity =
        isSignedIn && pathName === '/loginWithPinOrBiometry'

      if (isReturningFromInactivity) {
        router.canGoBack() && router.back()
      } else if (
        pathName === '/onboarding/mnemonic/confirmation' || // mnemonic onboarding completion
        pathName === '/onboarding/seedless/confirmation' || // seedless onboarding completion
        (pathName === '/loginWithPinOrBiometry' && !isSignedIn) // fresh app open
      ) {
        router.replace('/portfolio')
      }
    }
  }, [walletState, router, isSignedIn, pathName])

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
      <ApplicationContextProvider>
        <NavigationThemeProvider>
          <RecoveryMethodProvider>
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
                  gestureEnabled: false
                }}
              />
            </Stack>
            {enabledPrivacyScreen && <LogoModal />}
          </RecoveryMethodProvider>
        </NavigationThemeProvider>
      </ApplicationContextProvider>
      <GlobalToast />
    </K2AlpineThemeProvider>
  )
}

const DELAY = Platform.OS === 'android' ? 0 : 100
