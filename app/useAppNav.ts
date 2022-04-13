import { MutableRefObject, useEffect, useRef } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { SECURE_ACCESS_SET } from 'resources/Constants'
import AppNavigation from 'navigation/AppNavigation'
import { NavigationContainerRef } from '@react-navigation/native'

export type AppNavHook = {
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>
  navigateToRootWallet: () => void
  resetNavToRoot: () => void
  resetNavToEnterMnemonic: () => void
  setLoginRoute: () => void
}

export function useAppNav(): AppNavHook {
  const navigation = useRef<NavigationContainerRef<any>>()

  useEffect(() => {
    async function onFirstLoad() {
      if (!navigation.current) {
        console.log('waiting for navigation container...')
        setTimeout(() => onFirstLoad(), 1000)
        return
      }
      console.log('done.')
      AsyncStorage.getItem(SECURE_ACCESS_SET).then(result => {
        if (result) {
          setLoginRoute(navigation)
        } else {
          navigation.current?.navigate(AppNavigation.Root.Onboard, {
            screen: AppNavigation.Root.Welcome
          })
        }
      })
    }

    onFirstLoad().then()
  }, [])

  return {
    navigation,
    navigateToRootWallet: () => navigateToRootWallet(navigation),
    resetNavToRoot: () => resetNavToRoot(navigation),
    resetNavToEnterMnemonic: () => resetNavToEnterMnemonic(navigation),
    setLoginRoute: () => setLoginRoute(navigation)
  }
}

function navigateToRootWallet(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>
) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Wallet
      }
    ]
  })
}

function resetNavToRoot(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>
) {
  navigation.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: { screen: AppNavigation.Root.Welcome }
      }
    ]
  })
}

function resetNavToEnterMnemonic(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>
) {
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
      }
    ]
  })
}

function setLoginRoute(
  navigation: MutableRefObject<NavigationContainerRef<any> | undefined>
) {
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
