import { NavigationState } from '@react-navigation/native'
import { Router } from 'expo-router'

export const dismissTotpStack = (
  router: Router,
  navigationState?: NavigationState
): void => {
  // dismiss verifyTotpCode
  router.canGoBack() && router.back()
  // get previous previous screen
  const currentIndex = navigationState?.index
  const previousScreen = currentIndex
    ? navigationState.routes[currentIndex - 1]
    : undefined

  if (previousScreen?.name === 'selectMfaMethod') {
    // dismiss selectMfaMethod
    router.canGoBack() && router.back()
  }
}
