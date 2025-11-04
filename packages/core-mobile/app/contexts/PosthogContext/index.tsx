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
  selectIsEventsBlocked,
  selectSentrySampleRate,
  toggleAnalytics
} from 'store/posthog/slice'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { commonStorage } from 'utils/mmkv'
import { StorageKey } from 'resources/Constants'

export const PosthogContext = createContext<PosthogContextState>(
  {} as PosthogContextState
)

export interface PosthogContextState {
  setAnalyticsConsent: Dispatch<boolean | undefined>
  sentrySampleRate: number
}

export const PosthogContextProvider = ({
  children
}: {
  children: ReactNode
}): JSX.Element => {
  const dispatch = useDispatch()
  const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled)

  const eventsBlocked = useSelector(selectIsEventsBlocked)
  const sentrySampleRate = useSelector(selectSentrySampleRate)

  const { timeoutPassed } = useAppBackgroundTracker({
    timeoutMs: 30 * 60 * 1000,
    getTime: () => commonStorage.getString(StorageKey.POSTHOG_SUSPENDED),
    setTime: time => commonStorage.set(StorageKey.POSTHOG_SUSPENDED, time)
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
        sentrySampleRate
      }}>
      {children}
    </PosthogContext.Provider>
  )
}

export function usePosthogContext(): PosthogContextState {
  return useContext(PosthogContext)
}
