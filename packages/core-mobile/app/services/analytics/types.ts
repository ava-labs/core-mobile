import { AnalyticsEvents } from 'types/analytics'

export type AnalyticsEventName = keyof AnalyticsEvents

export type CaptureEventProperties<E extends AnalyticsEventName> =
  undefined extends AnalyticsEvents[E]
    ? [AnalyticsEvents[E]?]
    : [AnalyticsEvents[E]]

export type DeviceInfo = {
  $app_build: string
  $app_name: string
  $app_version: string
  $app_namespace: string
  $device_manufacturer: string
  $device_model: string
  $device_name: string
  $device_type: string
  $locale: string | undefined
  $network_carrier: string
  $os_name: string
  $os_version: string
  $timezone: string
}
