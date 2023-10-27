import { MutableRefObject, useRef } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { NavigationContainerRef } from '@react-navigation/native'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigationRef = MutableRefObject<NavigationContainerRef<any> | null>

export type AppNavHook = {
  navigation: NavigationRef
  navigateToRootWallet: () => void
  resetNavToRoot: () => void
  resetNavToEnterMnemonic: () => void
}

export function useAppNav(): AppNavHook {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const navigation = useRef<NavigationContainerRef<any> | null>(null)

  return {
    navigation,
    navigateToRootWallet: () => maybeSetRootWalletRoute(navigation),
    resetNavToRoot: () => resetNavToRoot(navigation),
    resetNavToEnterMnemonic: () => resetNavToEnterMnemonic(navigation)
  }
}

/**
 * This is used when we switch to unlockedApp state to set Root.Wallet as root route.
 * It is important to swap only root route because handling deepLinks will push new views
 * event if current state is lockedApp.
 */
function maybeSetRootWalletRoute(navigation: NavigationRef): void {
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
        name: AppNavigation.Root.NoWallet,
        params: { screen: AppNavigation.NoWallet.Drawer }
      }
    ]
  })
}

function resetNavToEnterMnemonic(navigation: NavigationRef): void {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.NoWallet,
        params: { screen: AppNavigation.Root.NoWallet }
      },
      {
        name: AppNavigation.Root.NoWallet,
        params: {
          screen: AppNavigation.NoWallet.Welcome,
          params: {
            screen: AppNavigation.Onboard.EnterWithMnemonicStack
          }
        }
      }
    ]
  })
}
