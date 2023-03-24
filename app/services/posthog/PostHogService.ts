import Config from 'react-native-config'
import { JsonMap } from 'store/posthog'
import Logger from 'utils/Logger'
import { getPosthogDeviceInfo } from './utils'

const PostHogCaptureUrl = `${Config.POSTHOG_URL}/capture/`

class PostHogService {
  async capture(
    eventName: string,
    distinctId: string,
    userId: string,
    properties?: JsonMap
  ) {
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
        distinct_id: distinctId,
        properties: {
          ...deviceInfo,
          ...properties,
          $user_id: userId
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
}

export default new PostHogService()
