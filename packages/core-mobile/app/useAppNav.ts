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
    navigateToRootWallet: () => navigateToRootWallet(navigation),
    resetNavToRoot: () => resetNavToRoot(navigation),
    resetNavToEnterMnemonic: () => resetNavToEnterMnemonic(navigation)
  }
}

function navigateToRootWallet(navigation: NavigationRef) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Wallet
      }
    ]
  })
}

function resetNavToRoot(navigation: NavigationRef) {
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

function resetNavToEnterMnemonic(navigation: NavigationRef) {
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
