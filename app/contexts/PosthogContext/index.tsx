import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { timer } from 'rxjs'
import Config from 'react-native-config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { useSelector, useDispatch } from 'react-redux'
import { selectIsAnalyticsEnabled, toggleAnalytics } from 'store/posthog'
import { createInstance } from 'services/token/TokenService'
import { sanitizeFeatureFlags } from './utils'
import { FeatureFlags, FeatureGates, FeatureVars } from './types'

const PostHogDecideUrl = `${Config.POSTHOG_URL}/decide?v=2`
const PostHogDecideFetchOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
    distinct_id: ''
  })
}

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState
)

export interface PosthogContextState {
  setAnalyticsConsent: Dispatch<boolean | undefined>
  swapBlocked: boolean
  bridgeBlocked: boolean
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  earnBlocked: boolean
  sendBlocked: boolean
  sendNftBlockediOS: boolean
  sendNftBlockedAndroid: boolean
  sentrySampleRate: number
  useFlatListAndroid: boolean
  coinbasePayBlocked: boolean
  useCoinGeckoPro: boolean
}

const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.EARN]: false,
  [FeatureGates.SEND]: true,
  [FeatureGates.SEND_NFT_IOS]: true,
  [FeatureGates.SEND_NFT_ANDROID]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '10', // 10% of events/errors
  [FeatureGates.USE_FLATLIST_ANDROID]: false,
  [FeatureGates.BUY_COINBASE_PAY]: true,
  [FeatureGates.USE_COINGECKO_PRO]: false
}

const ONE_MINUTE = 60 * 1000

const processFlags = (flags: FeatureFlags) => {
  const swapBlocked =
    !flags[FeatureGates.SWAP] || !flags[FeatureGates.EVERYTHING]

  const bridgeBlocked =
    !flags[FeatureGates.BRIDGE] || !flags[FeatureGates.EVERYTHING]

  const bridgeBtcBlocked =
    !flags[FeatureGates.BRIDGE_BTC] || !flags[FeatureGates.EVERYTHING]

  const bridgeEthBlocked =
    !flags[FeatureGates.BRIDGE_ETH] || !flags[FeatureGates.EVERYTHING]

  const sendBlocked =
    !flags[FeatureGates.SEND] || !flags[FeatureGates.EVERYTHING]

  const earnBlocked =
    !flags[FeatureGates.EARN] || !flags[FeatureGates.EVERYTHING]

  const sendNftBlockediOS =
    !flags[FeatureGates.SEND_NFT_IOS] || !flags[FeatureGates.EVERYTHING]

  const sendNftBlockedAndroid =
    !flags[FeatureGates.SEND_NFT_ANDROID] || !flags[FeatureGates.EVERYTHING]

  const eventsBlocked =
    !flags[FeatureGates.EVENTS] || !flags[FeatureGates.EVERYTHING]

  const sentrySampleRate =
    parseInt((flags[FeatureVars.SENTRY_SAMPLE_RATE] as string) ?? '0') / 100

  const useFlatListAndroid = !!flags[FeatureGates.USE_FLATLIST_ANDROID]

  const coinbasePayBlocked =
    !flags[FeatureGates.BUY_COINBASE_PAY] || !flags[FeatureGates.EVERYTHING]

  const useCoinGeckoPro =
    Boolean(flags[FeatureGates.USE_COINGECKO_PRO]) ||
    !flags[FeatureGates.EVERYTHING]

  return {
    swapBlocked,
    bridgeBlocked,
    bridgeBtcBlocked,
    bridgeEthBlocked,
    earnBlocked,
    sendBlocked,
    sendNftBlockediOS,
    sendNftBlockedAndroid,
    eventsBlocked,
    sentrySampleRate,
    useFlatListAndroid,
    coinbasePayBlocked,
    useCoinGeckoPro
  }
}

export const PosthogContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()
  const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled)

  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 30 * 60 * 1000,
    getTime: async () => AsyncStorage.getItem('POSTHOG_SUSPENDED'),
    setTime: async time => AsyncStorage.setItem('POSTHOG_SUSPENDED', time)
  })

  const [flags, setFlags] = useState<FeatureFlags>(DefaultFeatureFlagConfig)

  const [analyticsConsent, setAnalyticsConsent] = useState<
    boolean | undefined
  >()

  const {
    swapBlocked,
    bridgeBlocked,
    bridgeBtcBlocked,
    bridgeEthBlocked,
    earnBlocked,
    sendBlocked,
    sendNftBlockediOS,
    sendNftBlockedAndroid,
    eventsBlocked,
    sentrySampleRate,
    useFlatListAndroid,
    coinbasePayBlocked,
    useCoinGeckoPro
  } = useMemo(() => processFlags(flags), [flags])

  useEffect(
    () => SentryWrapper.setSampleRate(sentrySampleRate),
    [sentrySampleRate]
  )

  useEffect(() => {
    createInstance(useCoinGeckoPro)
  }, [useCoinGeckoPro])

  const reloadFeatureFlags = useCallback(() => {
    fetch(PostHogDecideUrl, PostHogDecideFetchOptions)
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Something went wrong')
      })
      .then(responseJson => {
        const sanitized = sanitizeFeatureFlags(responseJson)
        setFlags(sanitized)
      })
      .catch(error => {
        Logger.error('failed to fetch feature flags', error)
      })
  }, [])

  useEffect(reloadFlagsPeriodically, [reloadFeatureFlags])
  useEffect(setEventsLogging, [
    analyticsConsent,
    eventsBlocked,
    capture,
    dispatch,
    isAnalyticsEnabled
  ])
  useEffect(checkRestartSession, [capture, timeoutPassed])

  function checkRestartSession() {
    if (timeoutPassed) {
      capture('$opt_in')
    }
  }

  function reloadFlagsPeriodically() {
    const subscription = timer(0, ONE_MINUTE).subscribe({
      next: _ => {
        reloadFeatureFlags()
      }
    })

    return () => subscription?.unsubscribe()
  }

  /**
   * If analyticsConsent is undefinded it means user havent got to analytics
   * consent and we are collecting events up to the the point of consent screen.
   * After that user either consents or not and according to it we collect or not
   * events.
   */
  function setEventsLogging() {
    if (eventsBlocked) {
      dispatch(toggleAnalytics(false))
      return
    }
    if (analyticsConsent || analyticsConsent === undefined) {
      if (!isAnalyticsEnabled) {
        dispatch(toggleAnalytics(true))
        capture('$opt_in')
      }
    } else {
      dispatch(toggleAnalytics(false))
    }
  }

  return (
    <PosthogContext.Provider
      value={{
        setAnalyticsConsent,
        swapBlocked,
        bridgeBlocked,
        bridgeBtcBlocked,
        bridgeEthBlocked,
        earnBlocked,
        sendBlocked,
        sendNftBlockediOS,
        sendNftBlockedAndroid,
        sentrySampleRate,
        useFlatListAndroid,
        coinbasePayBlocked,
        useCoinGeckoPro
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext() {
  return useContext(PosthogContext)
}
