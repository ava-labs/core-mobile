import { NavigationState } from '@react-navigation/native'
import { Router } from 'expo-router'

export const dismissTotpStack = (
  router: Router,
  navigationState?: NavigationState
): void => {
  // dismiss verifyTotpCode
  router.canGoBack() && router.back()
  // get previous screen
  const currentIndex = navigationState?.index
  const previousScreen = currentIndex
    ? navigationState.routes[currentIndex - 1]
    : undefined

  if (previousScreen?.name === 'selectMfaMethod') {
    // dismiss selectMfaMethod
    router.canGoBack() && router.back()
  }
}

export const dismissToManageRecoveryMethods = (
  router: Router,
  navigationState?: NavigationState
): void => {
  const currentIndex = navigationState?.index
  const currenScreen = currentIndex
    ? navigationState.routes[currentIndex]
    : undefined

  const currentRoute =
    currenScreen?.state?.index &&
    currenScreen?.state?.routes[currenScreen.state.index]

  if (currentRoute && currentRoute?.name !== 'index') {
    router.canGoBack() && router.back()
  }
}
