import { AnalyticsEncryptedEvents, AnalyticsEvents } from 'types/analytics'

/**
 * Union of all analytics event names. The payload shape is resolved per
 * event via `CaptureEventProperties<E>` — events declared in
 * `AnalyticsEncryptedEvents` use the `{ encrypted, ...plaintextSiblings }`
 * shape and are transparently encrypted by `AnalyticsService.capture`.
 */
export type AnalyticsEventName =
  | keyof AnalyticsEvents
  | keyof AnalyticsEncryptedEvents

type EventPayload<E extends AnalyticsEventName> =
  E extends keyof AnalyticsEncryptedEvents
    ? AnalyticsEncryptedEvents[E]
    : E extends keyof AnalyticsEvents
    ? AnalyticsEvents[E]
    : never

export type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends EventPayload<E> ? [EventPayload<E>?] : [EventPayload<E>]

export interface AnalyticsServiceInterface {
  setEnabled(isEnabled: boolean): void
  capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void>
}
