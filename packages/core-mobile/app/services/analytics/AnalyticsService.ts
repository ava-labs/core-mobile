import PostHogService from 'services/posthog/PostHogService'
import { AnalyticsEventName, CaptureEventProperties } from './types'

class AnalyticsService {
  isEnabled: boolean | undefined

  configure({
    posthog: { distinctId, userId },
    isEnabled
  }: {
    posthog: { distinctId: string; userId: string }
    isEnabled: boolean
  }): void {
    PostHogService.configure({ distinctId, userId })

    this.isEnabled = isEnabled
  }

  async capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void> {
    if (this.isEnabled === false) {
      return
    }

    return PostHogService.capture(eventName, ...properties)
  }
}

export default new AnalyticsService()
