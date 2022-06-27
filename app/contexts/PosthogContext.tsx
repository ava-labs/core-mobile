import React, {
  createContext,
  Dispatch,
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

export interface PosthogContextState {
  capture: (event: string, properties?: JsonMap) => Promise<void>
  setAnalyticsConsent: Dispatch<boolean | undefined>
  swapBlocked: boolean
  bridgeBlocked: boolean
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  sendBlocked: boolean
}

const DefaultFeatureFlagConfig = {
  [FeatureGates.EVERYTHING]: true,
  [FeatureGates.EVENTS]: true,
  [FeatureGates.SWAP]: true,
  [FeatureGates.BRIDGE]: true,
  [FeatureGates.BRIDGE_BTC]: true,
  [FeatureGates.BRIDGE_ETH]: true,
  [FeatureGates.SEND]: true
}

const ONE_MINUTE = 60 * 1000

export const PosthogContextProvider = ({ children }: { children: any }) => {
  const [isPosthogReady, setIsPosthogReady] = useState(false)
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState(false)
  const posthogUserId = useSelector(selectUserID)

  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 30 * 60 * 1000,
    getTime: async () => AsyncStorage.getItem('POSTHOG_SUSPENDED'),
    setTime: async time => AsyncStorage.setItem('POSTHOG_SUSPENDED', time)
  })

  const [flags, setFlags] = useState<Record<FeatureGates, boolean>>(
    DefaultFeatureFlagConfig
  )
  const [analyticsConsent, setAnalyticsConsent] = useState<
    boolean | undefined
  >()
  const swapBlocked = !flags['swap-feature'] || !flags.everything
  const bridgeBlocked = !flags['bridge-feature'] || !flags.everything
  const bridgeBtcBlocked = !flags['bridge-feature-btc'] || !flags.everything
  const bridgeEthBlocked = !flags['bridge-feature-eth'] || !flags.everything
  const sendBlocked = !flags['send-feature'] || !flags.everything
  const eventsBlocked = !flags.events || !flags.everything

  useEffect(initPosthog, [])
  useEffect(reloadFlagsPeriodically, [isPosthogReady])
  useEffect(setEventsLogging, [
    analyticsConsent,
    isPosthogReady,
    eventsBlocked,
    isAnalyticsEnabled
  ])
  useEffect(checkRestartSession, [timeoutPassed])

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
            host: 'https://data-posthog.avax-test.network',
            android: {
              collectDeviceId: false
            },
            flushAt: 1,
            flushInterval: 10
          }
        : {
            debug: false,
            host: 'https://data-posthog.avax.network',
            android: {
              collectDeviceId: false
            }
          }
      const apiKey = __DEV__
        ? Config.POSTHOG_ANALYTICS_KEY_DEV
        : Config.POSTHOG_ANALYTICS_KEY
      await PostHog.setup(apiKey, config)

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

  function reloadFeatureFlags() {
    fetch('https://data-posthog.avax.network/decide?v=2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
        distinct_id: ''
      })
    })
      .catch(reason => (__DEV__ ? console.error(reason) : undefined))
      .then(value => value?.json())
      .then(value => {
        const result = value as {
          featureFlags: Record<FeatureGates, boolean>
        }
        setFlags(result.featureFlags)
      })
  }

  const capture = async (event: string, properties?: JsonMap) => {
    if (__DEV__) {
      console.log(event, properties)
    }
    return PostHog.capture(event, {
      ...properties,
      $ip: '',
      $user_id: posthogUserId
    })
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
        sendBlocked
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext() {
  return useContext(PosthogContext)
}
