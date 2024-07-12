import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectIsAnalyticsEnabled,
  selectIsBridgeBtcBlocked,
  selectIsBridgeEthBlocked,
  selectIsBrowserBlocked,
  selectIsCoinbasePayBlocked,
  selectIsEarnBlocked,
  selectIsEventsBlocked,
  selectIsSendNftBlockedAndroid,
  selectIsSendNftBlockediOS,
  selectSentrySampleRate,
  toggleAnalytics
} from 'store/posthog/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { commonStorage } from 'utils/mmkv'

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState
)

export interface PosthogContextState {
  setAnalyticsConsent: Dispatch<boolean | undefined>
  bridgeBtcBlocked: boolean
  bridgeEthBlocked: boolean
  earnBlocked: boolean
  browserBlocked: boolean
  sendNftBlockediOS: boolean
  sendNftBlockedAndroid: boolean
  sentrySampleRate: number
  coinbasePayBlocked: boolean
}

export const PosthogContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const dispatch = useDispatch()
  const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled)

  // TODO: in react components, use flags directly from redux
  const bridgeBtcBlocked = useSelector(selectIsBridgeBtcBlocked)
  const bridgeEthBlocked = useSelector(selectIsBridgeEthBlocked)
  const earnBlocked = useSelector(selectIsEarnBlocked)
  const sendNftBlockediOS = useSelector(selectIsSendNftBlockediOS)
  const sendNftBlockedAndroid = useSelector(selectIsSendNftBlockedAndroid)
  const eventsBlocked = useSelector(selectIsEventsBlocked)
  const sentrySampleRate = useSelector(selectSentrySampleRate)
  const coinbasePayBlocked = useSelector(selectIsCoinbasePayBlocked)
  const browserBlocked = useSelector(selectIsBrowserBlocked)

  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 30 * 60 * 1000,
    getTime: () => commonStorage.getString('POSTHOG_SUSPENDED'),
    setTime: time => commonStorage.set('POSTHOG_SUSPENDED', time)
  })

  const [analyticsConsent, setAnalyticsConsent] = useState<
    boolean | undefined
  >()

  useEffect(
    () => SentryWrapper.setSampleRate(sentrySampleRate),
    [sentrySampleRate]
  )

  useEffect(setEventsLogging, [
    analyticsConsent,
    eventsBlocked,
    dispatch,
    isAnalyticsEnabled
  ])

  useEffect(checkRestartSession, [timeoutPassed])

  function checkRestartSession(): void {
    if (timeoutPassed) {
      AnalyticsService.capture('AnalyticsEnabled')
    }
  }
  /**
   * If analyticsConsent is undefinded it means user havent got to analytics
   * consent and we are collecting events up to the the point of consent screen.
   * After that user either consents or not and according to it we collect or not
   * events.
   */
  function setEventsLogging(): void {
    if (eventsBlocked) {
      dispatch(toggleAnalytics(false))
      return
    }
    if (analyticsConsent || analyticsConsent === undefined) {
      if (!isAnalyticsEnabled) {
        dispatch(toggleAnalytics(true))
        AnalyticsService.capture('AnalyticsEnabled')
      }
    } else {
      AnalyticsService.capture('AnalyticsDisabled')
      dispatch(toggleAnalytics(false))
    }
  }

  return (
    <PosthogContext.Provider
      value={{
        setAnalyticsConsent,
        bridgeBtcBlocked,
        bridgeEthBlocked,
        earnBlocked,
        sendNftBlockediOS,
        sendNftBlockedAndroid,
        sentrySampleRate,
        coinbasePayBlocked,
        browserBlocked
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext(): PosthogContextState {
  return useContext(PosthogContext)
}
