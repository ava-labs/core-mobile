import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEvents } from 'types/analytics'
import Config from 'react-native-config'
import {
  CipherSuite,
  DhkemP521HkdfSha512,
  HkdfSha512,
  Aes256Gcm
} from '@hpke/core'
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
  private suite = new CipherSuite({
    kem: new DhkemP521HkdfSha512(),
    kdf: new HkdfSha512(),
    aead: new Aes256Gcm()
  })

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
    const { encrypted, enc } = await this.encrypt(stringifiedProperties)

    return PostHogService.capture(eventName, {
      data: encrypted,
      enc,
      keyID: ANALYTICS_ENCRYPTION_KEY_ID
    })
  }

  private async encrypt(
    message: string
  ): Promise<{ encrypted: string; enc: string }> {
    if (!crypto.subtle) {
      throw new Error('crypto.subtle is not available')
    }

    const deserializedPublicKey = await this.suite.kem.deserializePublicKey(
      Buffer.from(ANALYTICS_ENCRYPTION_KEY, 'base64')
    )

    const sender = await this.suite.createSenderContext({
      recipientPublicKey: deserializedPublicKey
    })

    const aad = new TextEncoder().encode(ANALYTICS_ENCRYPTION_KEY_ID)
    const data = new TextEncoder().encode(message)
    const ct = await sender.seal(data, aad)

    const encrypted = Buffer.from(ct).toString('base64')
    const enc = Buffer.from(sender.enc).toString('base64')

    return { encrypted, enc }
  }
}

export default new AnalyticsService()
