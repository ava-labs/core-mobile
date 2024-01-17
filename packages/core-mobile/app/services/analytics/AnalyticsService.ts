import Config from 'react-native-config'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { getPosthogDeviceInfo } from './utils'
import { AnalyticsEventName, CaptureEventProperties } from './types'

const PostHogCaptureUrl = `${Config.POSTHOG_URL}/capture/`

class AnalyticsService {
  distinctId: string | undefined
  userId: string | undefined
  isEnabled: boolean | undefined

  configure({
    distinctId,
    userId,
    isEnabled
  }: {
    distinctId: string
    userId: string
    isEnabled: boolean
  }): void {
    this.distinctId = distinctId
    this.userId = userId
    this.isEnabled = isEnabled
  }

  async capture<E extends AnalyticsEventName>(
    eventName: E,
    ...properties: CaptureEventProperties<E>
  ): Promise<void> {
    if (
      this.distinctId === undefined ||
      this.userId === undefined ||
      this.isEnabled === undefined
    ) {
      Logger.error(
        'AnalyticsService not configured. please call configureIds first'
      )
      return
    }

    if (this.isEnabled === false) {
      return
    }

    const deviceInfo = await getPosthogDeviceInfo()
    const PostHogCaptureFetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: Config.POSTHOG_ANALYTICS_KEY,
        event: eventName,
        timestamp: Date.now().toString(),
        ip: '',
        distinct_id: this.distinctId,
        properties: {
          ...deviceInfo,
          ...properties[0],
          $user_id: this.userId
        }
      })
    }
    fetch(PostHogCaptureUrl, PostHogCaptureFetchOptions)
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Something went wrong')
      })
      .catch(error => {
        Logger.error('failed to capture PostHog event', error)
      })
  }

  async identifyUser(distinctId: string): Promise<void> {
    const PostHogIdentifyFetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
        event: '$identify',
        timestamp: Date.now().toString(),
        ip: '',
        distinct_id: distinctId,
        $set: {
          $app_version: DeviceInfoService.getAppVersion()
        }
      })
    }
    fetch(PostHogCaptureUrl, PostHogIdentifyFetchOptions)
      .then(response => {
        if (response.ok) {
          return response.json()
        }
        throw new Error('Something went wrong')
      })
      .catch(error => {
        Logger.error('failed to capture PostHog identify event', error)
      })
  }
}

export default new AnalyticsService()
