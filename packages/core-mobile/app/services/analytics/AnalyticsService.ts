import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEvents } from 'types/analytics'
import { encrypt } from 'utils/hpke'
import Config from 'react-native-config'
import { AnalyticsEventName, CaptureEventProperties } from './types'

if (!Config.ANALYTICS_ENCRYPTION_KEY) {
  throw Error(
    'ANALYTICS_ENCRYPTION_KEY is missing. Please check your env file.'
  )
}

if (!Config.ANALYTICS_ENCRYPTION_KEY_ID) {
  throw Error(
    'ANALYTICS_ENCRYPTION_KEY_ID is missing. Please check your env file.'
  )
}

const ANALYTICS_ENCRYPTION_KEY = Config.ANALYTICS_ENCRYPTION_KEY

const ANALYTICS_ENCRYPTION_KEY_ID = Config.ANALYTICS_ENCRYPTION_KEY_ID

class AnalyticsService {
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
    const { encrypted, enc } = await encrypt(
      stringifiedProperties,
      ANALYTICS_ENCRYPTION_KEY,
      ANALYTICS_ENCRYPTION_KEY_ID
    )

    return PostHogService.capture(eventName, {
      data: encrypted,
      enc,
      keyID: ANALYTICS_ENCRYPTION_KEY_ID
    })
  }
}

export default new AnalyticsService()
