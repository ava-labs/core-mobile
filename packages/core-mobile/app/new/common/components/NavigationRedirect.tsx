import { useEffect } from 'react'
import 'react-native-reanimated'
import { selectWalletState, WalletState } from 'store/app'
import { useSelector } from 'react-redux'
import { useRootNavigationState, usePathname } from 'expo-router'
/**
 * Temporarily import "useNavigation" from @react-navigation/native.
 * This is a workaround due to a render bug in the expo-router version.
 * See: https://github.com/expo/expo/issues/35383
 * TODO: Adjust import back to expo-router once the bug is resolved.
 */
import { useNavigation } from '@react-navigation/native'
import { StackActions } from '@react-navigation/native'
import { useDebouncedRouter } from 'common/utils/useDebouncedRouter'

export const NavigationRedirect = (): null => {
  const router = useDebouncedRouter()
  const navigation = useNavigation()
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

    if (walletState === WalletState.NONEXISTENT) {
      if (router.canGoBack()) {
        navigation.dispatch(StackActions.popToTop())
      }
      router.replace('/signup')
    } else if (walletState === WalletState.INACTIVE) {
      router.navigate('/loginWithPinOrBiometry')
    }
  }, [walletState, router, navigation, isNavigationReady])

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
        router.replace('/portfolio')
      }
    }
  }, [walletState, router, isSignedIn, pathName, isNavigationReady])

  return null
}
