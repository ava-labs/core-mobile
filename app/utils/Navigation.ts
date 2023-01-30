import { createNavigationContainerRef } from '@react-navigation/native'
import { RootScreenStackParamList } from 'navigation/types'

/**
 * use this to navigate without the navigation prop.
 * if you have access to the navigation prop, do not use this.
 * more info: https://reactnavigation.org/docs/navigating-without-navigation-prop/
 */
export const navigationRef =
  createNavigationContainerRef<RootScreenStackParamList>()

type NavigateParam = Parameters<typeof navigationRef.navigate>[0]

export const navigate = (param: NavigateParam) => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(param)
  }
}

export const goBack = () => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack()
  }
}
