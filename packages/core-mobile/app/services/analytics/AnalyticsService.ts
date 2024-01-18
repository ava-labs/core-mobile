import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEventName, CaptureEventProperties } from './types'

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
}

export default new AnalyticsService()
