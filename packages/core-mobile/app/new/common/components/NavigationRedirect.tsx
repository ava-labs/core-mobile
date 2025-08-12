import {
  useFocusEffect,
  usePathname,
  useRootNavigationState,
  useRouter
} from 'expo-router'
import { useCallback, useEffect } from 'react'
import 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { selectWalletState, WalletState } from 'store/app'
import { BackHandler, InteractionManager } from 'react-native'
import { usePreventRemove } from '@react-navigation/native'

export const NavigationRedirect = (): null => {
  const router = useRouter()
  const pathName = usePathname()
  const walletState = useSelector(selectWalletState)
  const navigationState = useRootNavigationState()

  const isSignedIn = navigationState?.routes.some(
    (route: { name: string }) => route.name === '(signedIn)'
  )

  const isNavigationReady = Boolean(navigationState?.key)
  // Additional check for Expo Router - ensure segments are loaded

  // On Android, closing the signed-in stack should exit the app,
  // even if there is a back stack (e.g., onboarding/confirmation → portfolio)
  usePreventRemove(walletState === WalletState.ACTIVE, () => {
    BackHandler.exitApp()
  })

  // please be careful with the dependencies here
  // this effect is responsible for redirecting users
  // to either the sign up flow or the login modal
  // we don't want to include any other dependencies here
  useEffect(() => {
    if (!isNavigationReady) return

    // Ensure Root Layout is fully mounted
    InteractionManager.runAfterInteractions(() => {
      if (walletState === WalletState.NONEXISTENT) {
        // Use router.dismissAll() instead of navigation.dispatch
        if (router.canGoBack()) {
          router.dismissAll()
        }
        // @ts-ignore TODO: make routes typesafe
        router.replace('/signup')
      } else if (walletState === WalletState.INACTIVE) {
        // @ts-ignore TODO: make routes typesafe
        router.navigate('/loginWithPinOrBiometry')
      }
    })
  }, [walletState, router, isNavigationReady])

  // TODO: refactor this effect so that we don't depend on navigation state
  useEffect(() => {
    if (!isNavigationReady) return

    /**
     * after the wallet is successfully unlocked
     *
     * - redirect to the portfolio if:
     *   - the app was freshly opened
     *   - the user just completed onboarding (either mnemonic or seedless)
     * - otherwise, return the user to their previous/last screen if the app was locked due to inactivity.
     */

    // Ensure Root Layout is fully mounted
    InteractionManager.runAfterInteractions(() => {
      if (walletState === WalletState.ACTIVE) {
        // when the login modal is the last route and on top of the (signedIn) stack
        // it means the app just resumed from inactivity
        const isReturningFromInactivity =
          isSignedIn && pathName === '/loginWithPinOrBiometry'

        if (isReturningFromInactivity) {
          router.canGoBack() && router.back()
        } else if (
          pathName === '/onboarding/mnemonic/confirmation' ||
          pathName === '/onboarding/seedless/confirmation' ||
          (pathName === '/loginWithPinOrBiometry' && !isSignedIn)
        ) {
          // must call dismissAll() here
          // otherwise, pressing the back button will either take users:
          // - to a blank screen (if they are already logged in)
          // - back to the onboarding flow (when they just completed onboarding)
          if (router.canGoBack()) {
            router.dismissAll()
          }
          // @ts-ignore TODO: make routes typesafe
          router.replace('/portfolio')
        }
      }
    })
  }, [walletState, router, isSignedIn, pathName, isNavigationReady])

  return null
}
