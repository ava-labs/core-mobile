import { AnalyticsEncryptedEvents, AnalyticsEvents } from 'types/analytics'

export type AnalyticsEventName = keyof AnalyticsEvents
export type AnalyticsEncryptedEventName = keyof AnalyticsEncryptedEvents

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
  captureWithEncryption<E extends AnalyticsEncryptedEventName>(
    eventName: E,
    properties: AnalyticsEncryptedEvents[E]
  ): Promise<void>
}
