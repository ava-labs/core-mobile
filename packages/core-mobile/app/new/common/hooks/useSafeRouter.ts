// Import from expo-router-original to avoid circular dependency
// (expo-router imports are redirected to common/router which uses this hook)
import { useRouter } from 'expo-router-original'
import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'
import { GENERATED_THROTTLED_ROUTES } from 'common/router/generatedThrottledRoutes'

const THROTTLE_MS = 300

let lastNavigationTime = 0

const isThrottledRoute = (route: string | object): boolean => {
  if (typeof route === 'string') {
    return GENERATED_THROTTLED_ROUTES.some(
      throttledRoute =>
        route === throttledRoute || route.startsWith(`${throttledRoute}/`)
    )
  }

  if (typeof route === 'object' && route !== null && 'pathname' in route) {
    const pathname = (route as { pathname: string }).pathname
    return GENERATED_THROTTLED_ROUTES.some(
      throttledRoute =>
        pathname === throttledRoute ||
        pathname.startsWith(`${throttledRoute}/`) ||
        pathname.includes(`(modals)${throttledRoute}`)
    )
  }

  return false
}

const isThrottled = (): boolean => {
  const now = Date.now()
  if (now - lastNavigationTime < THROTTLE_MS) {
    return true
  }
  lastNavigationTime = now
  return false
}

/**
 * A wrapper around expo-router's useRouter that throttles navigation
 * to modal routes to prevent bottom sheet iOS navigation crashes.
 *
 * Only routes in GENERATED_THROTTLED_ROUTES (auto-generated from modals folder) will be throttled.
 * Other routes will navigate immediately without throttling.
 *
 * Run 'yarn generate:throttled-routes' to regenerate the routes list after adding new modals.
 */
export const useSafeRouter = (): ReturnType<typeof useRouter> => {
  const router = useRouter()

  const navigate: typeof router.navigate = useCallback(
    (...args: Parameters<typeof router.navigate>) => {
      const route = args[0]
      if (Platform.OS === 'ios' && isThrottledRoute(route) && isThrottled()) {
        return
      }
      router.navigate(...args)
    },
    [router]
  )

  const push: typeof router.push = useCallback(
    (...args: Parameters<typeof router.push>) => {
      const route = args[0]
      if (isThrottledRoute(route) && isThrottled()) {
        return
      }
      router.push(...args)
    },
    [router]
  )

  return useMemo(
    () => ({
      ...router,
      navigate,
      push
    }),
    [router, navigate, push]
  )
}

/**
 * Resets the throttle state. Only use this for testing purposes.
 * @internal
 */
export const resetNavigationThrottle = (): void => {
  lastNavigationTime = 0
}
