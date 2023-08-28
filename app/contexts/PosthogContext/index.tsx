import React, {
  createContext,
  Dispatch,
  ReactNode,
  useContext,
  useEffect,
  useState
} from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import useAppBackgroundTracker from 'hooks/useAppBackgroundTracker'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { usePostCapture } from 'hooks/usePosthogCapture'
import { useSelector, useDispatch } from 'react-redux'
import {
  selectIsAnalyticsEnabled,
  selectIsBridgeBlocked,
  selectIsBridgeBtcBlocked,
  selectIsBridgeEthBlocked,
  selectIsCoinbasePayBlocked,
  selectIsEarnBlocked,
  selectIsEventsBlocked,
  selectIsSendBlocked,
  selectIsSendNftBlockedAndroid,
  selectIsSendNftBlockediOS,
  selectIsSwapBlocked,
  selectSentrySampleRate,
  selectUseCoinGeckoPro,
  toggleAnalytics
} from 'store/posthog'
import { createInstance } from 'services/token/TokenService'

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
  coinbasePayBlocked: boolean
  useCoinGeckoPro: boolean
}

export const PosthogContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const dispatch = useDispatch()
  const { capture } = usePostCapture()
  const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled)

  // TODO: in react components, use flags directly from redux
  const swapBlocked = useSelector(selectIsSwapBlocked)
  const bridgeBlocked = useSelector(selectIsBridgeBlocked)
  const bridgeBtcBlocked = useSelector(selectIsBridgeBtcBlocked)
  const bridgeEthBlocked = useSelector(selectIsBridgeEthBlocked)
  const earnBlocked = useSelector(selectIsEarnBlocked)
  const sendBlocked = useSelector(selectIsSendBlocked)
  const sendNftBlockediOS = useSelector(selectIsSendNftBlockediOS)
  const sendNftBlockedAndroid = useSelector(selectIsSendNftBlockedAndroid)
  const eventsBlocked = useSelector(selectIsEventsBlocked)
  const sentrySampleRate = useSelector(selectSentrySampleRate)
  const coinbasePayBlocked = useSelector(selectIsCoinbasePayBlocked)
  const useCoinGeckoPro = useSelector(selectUseCoinGeckoPro)

  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 30 * 60 * 1000,
    getTime: async () => AsyncStorage.getItem('POSTHOG_SUSPENDED'),
    setTime: async time => AsyncStorage.setItem('POSTHOG_SUSPENDED', time)
  })

  const [analyticsConsent, setAnalyticsConsent] = useState<
    boolean | undefined
  >()

  useEffect(
    () => SentryWrapper.setSampleRate(sentrySampleRate),
    [sentrySampleRate]
  )

  useEffect(() => {
    createInstance(useCoinGeckoPro)
  }, [useCoinGeckoPro])

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
      capture('AnalyticsEnabled')
    }
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
        capture('AnalyticsEnabled')
      }
    } else {
      capture('AnalyticsDisabled')
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
