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
import PostHog from 'posthog-react-native'
import { timer } from 'rxjs'
import { JsonMap } from 'posthog-react-native/src/bridge'
import Config from 'react-native-config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import { useSelector } from 'react-redux'
import { posthogCapture, selectUserID } from 'store/posthog'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { TransactionName } from 'services/sentry/types'
import { sanitizeFeatureFlags } from './utils'
import {
  FeatureFlags,
  FeatureGates,
  FeatureVars,
  getSentryTransactionName,
  PosthogCapture,
  requireSentryFlag
} from './types'

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

const PostHogAnalyticsConfig = __DEV__
  ? {
      debug: true,
      host: Config.POSTHOG_URL,
      android: {
        collectDeviceId: false
      },
      flushAt: 1,
      flushInterval: 10
    }
  : {
      debug: false,
      host: Config.POSTHOG_URL,
      android: {
        collectDeviceId: false
      }
    }

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState
)

export interface PosthogContextState {
  capture: PosthogCapture
  setAnalyticsConsent: Dispatch<boolean | undefined>
  swapBlocked: boolean
  bridgeBlocked: boolean
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  sendBlocked: boolean
  sendNftBlockediOS: boolean
  sendNftBlockedAndroid: boolean
  sentrySampleRate: number
  sentrySampleRatePerTx: Record<TransactionName, number>
  useFlatListAndroid: boolean
}

const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.SEND]: true,
  [FeatureGates.SEND_NFT_IOS]: true,
  [FeatureGates.SEND_NFT_ANDROID]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '10', // 10% of events/errors
  [FeatureGates.USE_FLATLIST_ANDROID]: false
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

  const sendNftBlockediOS =
    !flags[FeatureGates.SEND_NFT_IOS] || !flags[FeatureGates.EVERYTHING]

  const sendNftBlockedAndroid =
    !flags[FeatureGates.SEND_NFT_ANDROID] || !flags[FeatureGates.EVERYTHING]

  const eventsBlocked =
    !flags[FeatureGates.EVENTS] || !flags[FeatureGates.EVERYTHING]

  const sentrySampleRate =
    parseInt((flags[FeatureVars.SENTRY_SAMPLE_RATE] as string) ?? '0') / 100

  const sentrySampleRatePerTx = {} as Record<TransactionName, number>
  for (const flagsKey in flags) {
    try {
      requireSentryFlag(flagsKey)
      const sampleRate = parseInt((flags[flagsKey] as string) ?? '0') / 100
      sentrySampleRatePerTx[getSentryTransactionName(flagsKey)] = sampleRate
    } catch (e) {
      //just skip
    }
  }

  const useFlatListAndroid = !!flags[FeatureGates.USE_FLATLIST_ANDROID]

  return {
    swapBlocked,
    bridgeBlocked,
    bridgeBtcBlocked,
    bridgeEthBlocked,
    sendBlocked,
    sendNftBlockediOS,
    sendNftBlockedAndroid,
    eventsBlocked,
    sentrySampleRate,
    sentrySampleRatePerTx,
    useFlatListAndroid
  }
}

export const PosthogContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [isPosthogReady, setIsPosthogReady] = useState(false)
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false)
  const posthogUserId = useSelector(selectUserID)

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
    sendBlocked,
    sendNftBlockediOS,
    sendNftBlockedAndroid,
    eventsBlocked,
    sentrySampleRate,
    sentrySampleRatePerTx,
    useFlatListAndroid
  } = useMemo(() => processFlags(flags), [flags])

  useEffect(
    () => SentryWrapper.setSampleRate(sentrySampleRate),
    [sentrySampleRate]
  )

  const capture = useCallback(
    (event: string, properties?: JsonMap) =>
      posthogCapture({ posthogUserId, event, properties }),
    [posthogUserId]
  )

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

  useEffect(initPosthog, [])
  useEffect(reloadFlagsPeriodically, [isPosthogReady, reloadFeatureFlags])
  useEffect(setEventsLogging, [
    analyticsConsent,
    isPosthogReady,
    eventsBlocked,
    isAnalyticsEnabled,
    capture
  ])
  useEffect(checkRestartSession, [capture, timeoutPassed])

  function checkRestartSession() {
    if (timeoutPassed) {
      capture('$opt_in')
    }
  }

  function initPosthog() {
    ;(async function () {
      await PostHog.setup(
        Config.POSTHOG_ANALYTICS_KEY ?? '',
        PostHogAnalyticsConfig
      )

      await disableAnalytics()
      setIsPosthogReady(true)
    })()
  }

  function reloadFlagsPeriodically() {
    if (!isPosthogReady) {
      return
    }
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
    if (!isPosthogReady) {
      return
    }
    if (eventsBlocked) {
      disableAnalytics()
      return
    }
    if (analyticsConsent || analyticsConsent === undefined) {
      if (!isAnalyticsEnabled) {
        enableAnalytics()
        capture('$opt_in')
      }
    } else {
      disableAnalytics()
    }
  }

  async function enableAnalytics() {
    await PostHog.enable()
    setIsAnalyticsEnabled(true)
  }

  async function disableAnalytics() {
    await PostHog.disable()
    setIsAnalyticsEnabled(false)
  }

  return (
    <PosthogContext.Provider
      value={{
        capture,
        setAnalyticsConsent,
        swapBlocked,
        bridgeBlocked,
        bridgeBtcBlocked,
        bridgeEthBlocked,
        sendBlocked,
        sendNftBlockediOS,
        sendNftBlockedAndroid,
        sentrySampleRate,
        sentrySampleRatePerTx,
        useFlatListAndroid
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext() {
  return useContext(PosthogContext)
}
