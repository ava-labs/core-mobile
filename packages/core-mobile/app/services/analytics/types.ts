import { AnalyticsEvents } from 'types/analytics'

export type AnalyticsEventName = keyof AnalyticsEvents

export type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends AnalyticsEvents[E]
    ? [AnalyticsEvents[E]?]
    : [AnalyticsEvents[E]]
