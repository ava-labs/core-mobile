import { createNavigationContainerRef } from '@react-navigation/native'
import { RootScreenStackParamList } from 'navigation/types'

let pinRecovery = false

export const isPinRecovery = (): boolean => pinRecovery
export const setPinRecovery = (value: boolean): void => {
  pinRecovery = value
}

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
