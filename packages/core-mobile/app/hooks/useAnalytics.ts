import { useDispatch } from 'react-redux'
import { capture as _capture } from 'store/posthog'
import { useCallback } from 'react'
import { setCoreAnalytics } from 'store/settings/securityPrivacy'
import {
  AnalyticsEventName,
  CaptureEventProperties
} from 'services/posthog/types'

export function useAnalytics(): {
  capture: <E extends AnalyticsEventName>(
    event: E,
    ...properties: CaptureEventProperties<E>
  ) => void
} {
  const dispatch = useDispatch()

  const capture = useCallback(
    <E extends AnalyticsEventName>(
      event: E,
      ...properties: CaptureEventProperties<E>
    ) => {
      dispatch(
        _capture({
          event,
          properties: properties[0]
        })
      )
    },
    [dispatch]
  )

  return {
    capture
  }
}

export function useAnalyticsConsent(): {
  accept: () => void
  reject: () => void
} {
  const dispatch = useDispatch()
  const { capture } = useAnalytics()

  const accept = (): void => {
    capture('OnboardingAnalyticsAccepted')
    dispatch(setCoreAnalytics(true))
  }

  const reject = (): void => {
    capture('OnboardingAnalyticsRejected')
    dispatch(setCoreAnalytics(false))
  }

  return {
    accept,
    reject
  }
}
