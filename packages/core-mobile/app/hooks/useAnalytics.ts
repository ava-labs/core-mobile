import { useDispatch } from 'react-redux'
import { capture as captureAction } from 'store/posthog'
import { useCallback } from 'react'
import { AnyAction } from '@reduxjs/toolkit'
import { AnalyticsEvents } from 'types/analytics'

type AnalyticsEventName = keyof AnalyticsEvents

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
        captureAction({
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

type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends AnalyticsEvents[E]
    ? [AnalyticsEvents[E]?]
    : [AnalyticsEvents[E]]

export function captureEvent<E extends AnalyticsEventName>(
  event: E,
  ...properties: CaptureEventProperties<E>
): AnyAction {
  return captureAction({
    event,
    properties: properties[0]
  })
}
