import { useDispatch } from 'react-redux'
import { capture } from 'store/posthog'
import { useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAnalytics() {
  const dispatch = useDispatch()

  const track = useCallback(
    <E extends AnalyticsEventName>(
      event: E,
      ...properties: undefined extends AnalyticsEventParamList[E]
        ? [AnalyticsEventParamList[E]?]
        : [AnalyticsEventParamList[E]]
    ) => {
      dispatch(
        capture({
          event,
          properties: properties[0]
        })
      )
    },
    [dispatch]
  )

  return {
    track
  }
}

type AnalyticsEventName = keyof AnalyticsEventParamList

export function trackEvent<E extends AnalyticsEventName>(
  event: E,
  ...properties: undefined extends AnalyticsEventParamList[E]
    ? [AnalyticsEventParamList[E]?]
    : [AnalyticsEventParamList[E]]
): void {
  capture({
    event,
    properties: properties[0]
  })
}

type AnalyticsEventParamList = {
  OnboardingSubmitSucceeded: { walletType: string }
  OnboardingSubmitFailed: { walletType: string }
}
