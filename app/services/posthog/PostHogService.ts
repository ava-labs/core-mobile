import Config from 'react-native-config'
import { JsonMap } from 'store/posthog/types'
import Logger from 'utils/Logger'
import { getPosthogDeviceInfo } from './utils'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'

const PostHogCaptureUrl = `${Config.POSTHOG_URL}/capture/`

const PostHogDecideUrl = `${Config.POSTHOG_URL}/decide?v=2`
const PostHogDecideFetchOptions = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
    distinct_id: ''
  })
}

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

  async fetchFeatureFlags() {
    try {
      Logger.info('fetching feature flags')
      const response = await fetch(PostHogDecideUrl, PostHogDecideFetchOptions)

      if (!response.ok) {
        throw new Error('Something went wrong')
      }

      const responseJson = await response.json()
      const featureFlags = sanitizeFeatureFlags(responseJson)
      Logger.info('feature flags', featureFlags)

      return featureFlags
    } catch (e) {
      Logger.error('failed to fetch feature flags', e)
    }
  }
}

export default new PostHogService()
