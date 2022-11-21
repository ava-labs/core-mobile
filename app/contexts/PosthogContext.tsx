import React, {
  createContext,
  Dispatch,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState
} from 'react'
import PostHog from 'posthog-react-native'
import { timer } from 'rxjs'
import { JsonMap } from 'posthog-react-native/src/bridge'
import Config from 'react-native-config'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import { useSelector } from 'react-redux'
import { selectUserID } from 'store/posthog'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState
)

enum FeatureGates {
  EVERYTHING = 'everything',
  EVENTS = 'events',
  SWAP = 'swap-feature',
  BRIDGE = 'bridge-feature',
  BRIDGE_BTC = 'bridge-feature-btc',
  BRIDGE_ETH = 'bridge-feature-eth',
  SEND = 'send-feature'
}

enum FeatureVars {
  SENTRY_SAMPLE_RATE = 'sentry-sample-rate'
}

export type PosthogCapture = (
  event: string,
  properties?: JsonMap
) => Promise<void>

export interface PosthogContextState {
  capture: PosthogCapture
  setAnalyticsConsent: Dispatch<boolean | undefined>
  swapBlocked: boolean
  bridgeBlocked: boolean
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  sendBlocked: boolean
  sentrySampleRate: number
}

const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.SEND]: true,
  [FeatureVars.SENTRY_SAMPLE_RATE]: '0.1'
}

const ONE_MINUTE = 60 * 1000

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

  const [flags, setFlags] = useState<
    Record<FeatureGates | FeatureVars, boolean | string>
  >(DefaultFeatureFlagConfig)
  const [analyticsConsent, setAnalyticsConsent] = useState<
    boolean | undefined
  >()
  const swapBlocked = !flags['swap-feature'] || !flags.everything
  const bridgeBlocked = !flags['bridge-feature'] || !flags.everything
  const bridgeBtcBlocked = !flags['bridge-feature-btc'] || !flags.everything
  const bridgeEthBlocked = !flags['bridge-feature-eth'] || !flags.everything
  const sendBlocked = !flags['send-feature'] || !flags.everything
  const eventsBlocked = !flags.events || !flags.everything
  const sentrySampleRate =
    parseInt((flags['sentry-sample-rate'] as string) ?? '0') / 100
  SentryWrapper.setSampleRate(sentrySampleRate)

  const capture = useCallback(
    async (event: string, properties?: JsonMap) => {
      Logger.info(event, properties)
      return PostHog.capture(event, {
        ...properties,
        $ip: '',
        $user_id: posthogUserId
      })
    },
    [posthogUserId]
  )

  const reloadFeatureFlags = useCallback(() => {
    fetch(`${Config.POSTHOG_URL}/decide?v=2`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
        distinct_id: ''
      })
    })
      .catch(reason => Logger.error(reason))
      .then(value => value?.json())
      .then(value => {
        const result = value as {
          featureFlags: Record<FeatureGates | FeatureVars, boolean | string>
        }
        setFlags(result.featureFlags)
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
      const config = __DEV__
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
      await PostHog.setup(Config.POSTHOG_ANALYTICS_KEY ?? '', config)

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
        sentrySampleRate
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext() {
  return useContext(PosthogContext)
}
