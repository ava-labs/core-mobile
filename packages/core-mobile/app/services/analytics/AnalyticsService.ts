import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEvents } from 'types/analytics'
import Config from 'react-native-config'
import { encrypt } from 'utils/hpke'
import Logger from 'utils/Logger'
import { AnalyticsServiceNoop } from 'services/analytics/AnalyticsServiceNoop'
import { AnalyticsEventName, CaptureEventProperties } from './types'

if (!Config.ANALYTICS_ENCRYPTION_KEY) {
  Logger.info(
    'ANALYTICS_ENCRYPTION_KEY is missing in env file. Analytics are disabled.'
  )
}

if (!Config.ANALYTICS_ENCRYPTION_KEY_ID) {
  Logger.warn(
    'ANALYTICS_ENCRYPTION_KEY_ID is missing in env file. Analytics are disabled.'
  )
}

const ANALYTICS_ENCRYPTION_KEY = Config.ANALYTICS_ENCRYPTION_KEY
const ANALYTICS_ENCRYPTION_KEY_ID = Config.ANALYTICS_ENCRYPTION_KEY_ID

class AnalyticsService {
  constructor(private analyticsEncryptionKey: string) {}

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

    const stringifiedProperties = JSON.stringify(properties)
    const { encrypted, enc, keyID } = await encrypt(
      stringifiedProperties,
      this.analyticsEncryptionKey,
      ANALYTICS_ENCRYPTION_KEY_ID
    )

    return PostHogService.capture(eventName, {
      data: encrypted,
      enc,
      keyID: keyID
    })
  }
}

export default ANALYTICS_ENCRYPTION_KEY
  ? new AnalyticsService(ANALYTICS_ENCRYPTION_KEY)
  : new AnalyticsServiceNoop()
