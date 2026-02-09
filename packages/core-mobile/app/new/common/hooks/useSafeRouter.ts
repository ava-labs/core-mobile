// Import from expo-router-original to avoid circular dependency
// (expo-router imports are redirected to common/router which uses this hook)
import { useRouter } from 'expo-router-original'
import { useCallback, useMemo } from 'react'
import { Platform } from 'react-native'

const THROTTLE_MS = 300

let lastNavigationTime = 0

/**
 * Modal routes that should be throttled to prevent bottom sheet iOS navigation crashes.
 */
const THROTTLED_ROUTES = [
  '/accountSettings',
  '/approval',
  '/keystoneSigner',
  '/keystoneTroubleshooting',
  '/receive',
  '/notifications',
  '/walletConnectScan',
  '/authorizeDapp',
  '/collectibleSend',
  '/send',
  '/swap',
  '/selectSwapFromToken',
  '/selectSwapToToken',
  '/buy',
  '/selectSendToken',
  '/selectReceiveNetwork',
  '/tokenManagement',
  '/tokenDetail',
  '/defiDetail',
  '/collectibleDetail',
  '/trackTokenDetail',
  '/collectibleManagement',
  '/bridge',
  '/bridgeStatus',
  '/selectBridgeSourceNetwork',
  '/selectBridgeTargetNetwork',
  '/selectBridgeToken',
  '/addStake',
  '/stakeDetail',
  '/claimStakeReward',
  '/toggleDeveloperMode',
  '/editContact',
  '/addEthereumChain',
  '/selectCustomTokenNetwork',
  '/meld/onramp',
  '/meld/offramp',
  '/meldOnrampTokenList',
  '/meldOfframpTokenList',
  '/meldOnrampPaymentMethod',
  '/meldOfframpPaymentMethod',
  '/meldOnrampCountry',
  '/meldOnrampCurrency',
  '/meldOfframpCountry',
  '/meldOfframpCurrency',
  '/transactionSuccessful',
  '/solanaLaunch',
  '/nestEggCampaign',
  '/appUpdate',
  '/deposit',
  '/depositDetail',
  '/withdraw',
  '/wallets',
  '/ledgerReviewTransaction',
  '/solanaConnection'
] as const

const isThrottledRoute = (route: string | object): boolean => {
  if (typeof route === 'string') {
    return THROTTLED_ROUTES.some(
      throttledRoute =>
        route === throttledRoute || route.startsWith(`${throttledRoute}/`)
    )
  }

  if (typeof route === 'object' && route !== null && 'pathname' in route) {
    const pathname = (route as { pathname: string }).pathname
    return THROTTLED_ROUTES.some(
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
 * Only routes in the THROTTLED_ROUTES will be throttled.
 * Other routes will navigate immediately without throttling.
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
