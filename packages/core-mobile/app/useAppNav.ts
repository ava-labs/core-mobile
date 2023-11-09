import { MutableRefObject, useRef } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { NavigationContainerRef } from '@react-navigation/native'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigationRef = MutableRefObject<NavigationContainerRef<any> | null>

export type AppNavHook = {
  navigation: NavigationRef
  resetNavToUnlockedWallet: () => void
  resetNavToRoot: () => void
  resetNavToEnterMnemonic: () => void
}

export function useAppNav(): AppNavHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useRef<NavigationContainerRef<any> | null>(null)

  return {
    navigation,
    resetNavToUnlockedWallet: () => resetNavToUnlockedWallet(navigation),
    resetNavToRoot: () => resetNavToRoot(navigation),
    resetNavToEnterMnemonic: () => resetNavToEnterMnemonic(navigation)
  }
}

/**
 * This is used when we switch to unlockedApp state to set Root.Wallet as root route.
 * It is important to swap only root route because handling deepLinks and walletConnect listeners
 * will push new views even if current state is lockedApp.
 */
function resetNavToUnlockedWallet(navigation: NavigationRef): void {
  if (
    navigation.current?.getState().routes[0]?.name !== AppNavigation.Root.Wallet
  ) {
    const others = navigation.current?.getState().routes.slice(1) ?? []
    navigation.current?.reset({
      index: 0,
      // @ts-ignore
      routes: [
        {
          name: AppNavigation.Root.Wallet
        },
        ...others
      ]
    })
  }
}

function resetNavToRoot(navigation: NavigationRef): void {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: { screen: AppNavigation.Onboard.Signup }
      }
    ]
  })
}

function resetNavToEnterMnemonic(navigation: NavigationRef): void {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Onboard.Welcome,
        params: { screen: AppNavigation.Onboard.EnterWithMnemonicStack }
      }
    ]
  })
}
