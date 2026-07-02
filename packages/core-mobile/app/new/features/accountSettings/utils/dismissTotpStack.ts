import { NavigationState } from 'expo-router/react-navigation'
import { useRouter } from 'expo-router'

type Router = ReturnType<typeof useRouter>

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
