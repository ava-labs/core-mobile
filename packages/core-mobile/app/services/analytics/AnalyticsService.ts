import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEvents } from 'types/analytics'
import Config from 'react-native-config'
import { encrypt } from 'utils/hpke'
import Logger from 'utils/Logger'
import { AnalyticsServiceNoop } from 'services/analytics/AnalyticsServiceNoop'
import {
  AnalyticsEventName,
  AnalyticsServiceInterface,
  CaptureEventProperties
} from './types'

if (!Config.ANALYTICS_ENCRYPTION_KEY) {
  Logger.warn(
    'ANALYTICS_ENCRYPTION_KEY is missing in env file. Analytics are disabled.'
  )
}

if (!Config.ANALYTICS_ENCRYPTION_KEY_ID) {
  Logger.warn(
    'ANALYTICS_ENCRYPTION_KEY_ID is missing in env file. Analytics are disabled.'
  )
}

class AnalyticsService implements AnalyticsServiceInterface {
  constructor(
    private analyticsEncryptionKey: string,
    private analyticsEncryptionKeyId: string
  ) {}

  private isEnabled: boolean | undefined

  setEnabled(isEnabled: boolean): void {
    this.isEnabled = isEnabled
  }

  async capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    return PostHogService.capture(eventName, properties[0])
  }

  async captureWithEncryption<E extends AnalyticsEventName>(
    eventName: E,
    properties: AnalyticsEvents[E]
  ): Promise<void> {
    if (!this.isEnabled) {
      return
    }

    try {
      const stringifiedProperties = JSON.stringify(properties)
      const { encrypted, enc, keyID } = await encrypt(
        stringifiedProperties,
        this.analyticsEncryptionKey,
        this.analyticsEncryptionKeyId
      )

      return PostHogService.capture(eventName, {
        data: encrypted,
        enc,
        keyID: keyID
      })
    } catch (error) {
      Logger.error(
        `Failed to capture encrypted analytics event: ${eventName}`,
        error
      )
    }
  }
}

export default Config.ANALYTICS_ENCRYPTION_KEY &&
Config.ANALYTICS_ENCRYPTION_KEY_ID
  ? new AnalyticsService(
      Config.ANALYTICS_ENCRYPTION_KEY,
      Config.ANALYTICS_ENCRYPTION_KEY_ID
    )
  : new AnalyticsServiceNoop()
