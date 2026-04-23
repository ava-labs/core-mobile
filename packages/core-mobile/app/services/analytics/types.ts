import { AnalyticsEvents } from 'types/analytics'

export type AnalyticsEventName = keyof AnalyticsEvents

export type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends AnalyticsEvents[E]
    ? [AnalyticsEvents[E]?]
    : [AnalyticsEvents[E]]

export interface AnalyticsServiceInterface {
  setEnabled(isEnabled: boolean): void
  capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void>
}
