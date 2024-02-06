import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEvents } from 'types/analytics'
import { encrypt } from 'utils/hpke'
import { AnalyticsEventName, CaptureEventProperties } from './types'

const ANALYTICS_ENCRYPTION_KEY =
  'BAGTTmV3zoQ37Gmmaq32mA78oTnXpX9rYckjhKl8O5lDM71llL2StrTOoJ3nbNMuAfKI2c+b6Q8g9y+ULHlKlftpywFQ9rlmdu3BdZnROsBVL+fQ79RXd7uYmad2L7UHbm8II4AYSGHsbZIxElC9MNjm1g1heGCkbLdvVnzPiLWQRmQX2Q=='

const ANALYTICS_ENCRYPTION_KEY_ID = '83fe1b26-d715-486a-b073-fb7ed6734c51'

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
