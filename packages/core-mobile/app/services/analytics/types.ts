import { AnalyticsEvents, AnalyticsPlaintextEvents } from 'types/analytics'

export type AnalyticsEventName = keyof AnalyticsEvents

export type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends AnalyticsEvents[E]
    ? [AnalyticsEvents[E]?]
    : [AnalyticsEvents[E]]

export type PlaintextProperties<E extends AnalyticsEventName> =
  E extends keyof AnalyticsPlaintextEvents
    ? AnalyticsPlaintextEvents[E]
    : undefined

export interface AnalyticsServiceInterface {
  setEnabled(isEnabled: boolean): void
  capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void>
  captureWithEncryption<E extends AnalyticsEventName>(
    eventName: E,
    properties: AnalyticsEvents[E],
    plaintextProperties?: PlaintextProperties<E>
  ): Promise<void>
}
