import { createNavigationContainerRef } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { RootScreenStackParamList } from 'navigation/types'

/**
 * use this to navigate without the navigation prop.
 * if you have access to the navigation prop, do not use this.
 * more info: https://reactnavigation.org/docs/navigating-without-navigation-prop/
 */
export const navigationRef =
  createNavigationContainerRef<RootScreenStackParamList>()

type NavigateParam = Parameters<typeof navigationRef.navigate>[0]

// COMMON NAVIGATION LOGIC
export const navigate = (param: NavigateParam): void => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(param)
  }
}

export const goBack = (): void => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack()
  }
}

// CORE-MOBILE SPECIFIC NAVIGATION LOGIC

/**
 * This is used when we switch to unlockedApp state to set Root.Wallet as root route.
 * It is important to swap only root route because handling deepLinks and walletConnect listeners
 * will push new views even if current state is lockedApp.
 */
export const resetNavToUnlockedWallet = (): void => {
  if (
    navigationRef.current?.getState().routes[0]?.name !==
    AppNavigation.Root.Wallet
  ) {
    const others = navigationRef.current?.getState().routes.slice(1) ?? []
    navigationRef.current?.reset({
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

export const resetNavToRoot = (): void => {
  navigationRef.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Root.Onboard,
        params: { screen: AppNavigation.Onboard.Signup }
      }
    ]
  })
}

export const resetNavToEnterMnemonic = (): void => {
  navigationRef.current?.reset({
    index: 0,
    routes: [
      {
        name: AppNavigation.Onboard.Welcome,
        params: { screen: AppNavigation.Onboard.EnterWithMnemonicStack }
      }
    ]
  })
}
