import { MutableRefObject, useRef } from 'react'
import AppNavigation from 'navigation/AppNavigation'
import { NavigationContainerRef } from '@react-navigation/native'

type NavigationRef = MutableRefObject<NavigationContainerRef<any> | null>

export type AppNavHook = {
  navigation: NavigationRef
  navigateToRootWallet: () => void
  resetNavToRoot: () => void
  resetNavToEnterMnemonic: () => void
  setLoginRoute: () => void
}

export function useAppNav(): AppNavHook {
  const navigation = useRef<NavigationContainerRef<any> | null>(null)

  return {
    navigation,
    navigateToRootWallet: () => navigateToRootWallet(navigation),
    resetNavToRoot: () => resetNavToRoot(navigation),
    resetNavToEnterMnemonic: () => resetNavToEnterMnemonic(navigation),
    setLoginRoute: () => setLoginRoute(navigation)
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
        name: AppNavigation.Root.NoWallet
      }
    ]
  })
}

function resetNavToEnterMnemonic(navigation: NavigationRef) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: { screen: AppNavigation.Root.Welcome }
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome
        }
      }
    ]
  })
}

function setLoginRoute(navigation: NavigationRef) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: { screen: AppNavigation.Root.Welcome }
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome,
          params: {
            screen: AppNavigation.Onboard.EnterWithMnemonicStack
          }
        }
      },
      {
        name: AppNavigation.Root.Onboard,
        params: {
          screen: AppNavigation.Root.Welcome,
          params: {
            screen: AppNavigation.Onboard.Login
          }
        }
      }
    ]
  })
}
