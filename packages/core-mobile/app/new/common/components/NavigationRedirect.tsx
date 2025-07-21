import { useCallback, useEffect } from 'react'
import 'react-native-reanimated'
import { selectWalletState, WalletState } from 'store/app'
import { useSelector } from 'react-redux'
import {
  useRootNavigationState,
  useRouter,
  usePathname,
  useFocusEffect
} from 'expo-router'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { BackHandler } from 'react-native'

export const NavigationRedirect = (): null => {
  const router = useRouter()
  const pathName = usePathname()
  const walletState = useSelector(selectWalletState)
  const navigationState = useRootNavigationState()

  const isSignedIn = navigationState?.routes.some(
    (route: { name: string }) => route.name === '(signedIn)'
  )

  const isNavigationReady = Boolean(navigationState?.key)

  // please be careful with the dependencies here
  // this effect is responsible for redirecting users
  // to either the sign up flow or the login modal
  // we don't want to include any other dependencies here
  useEffect(() => {
    if (!isNavigationReady) return

    // Add a small delay to ensure Root Layout component is fully mounted
    // This prevents "Attempted to navigate before mounting" error
    const navigationTimeout = setTimeout(() => {
      if (walletState === WalletState.NONEXISTENT) {
        if (router.canGoBack()) {
          router.dismissAll()
        }
        // @ts-ignore TODO: make routes typesafe
        router.replace('/signup')
      } else if (walletState === WalletState.INACTIVE) {
        // @ts-ignore TODO: make routes typesafe
        router.replace('/loginWithPinOrBiometry')
      }
    }, 100)

    return () => clearTimeout(navigationTimeout)
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
    if (walletState === WalletState.ACTIVE) {
      // Add a small delay to ensure Root Layout component is fully mounted
      const navigationTimeout = setTimeout(() => {
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
          while (router.canGoBack()) {
            router.dismissAll()
          }
          // @ts-ignore TODO: make routes typesafe
          router.replace('/portfolio')
        }
      }, 100)

      return () => clearTimeout(navigationTimeout)
    }
  }, [walletState, router, isSignedIn, pathName, isNavigationReady])

  useFocusEffect(
    useCallback(() => {
      const onBackPress = (): boolean => {
        if (!router.canGoBack()) {
          BackHandler.exitApp()
          return true
        } else {
          return false
        }
      }
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      )

      return () => subscription.remove()
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  )

  return null
}
