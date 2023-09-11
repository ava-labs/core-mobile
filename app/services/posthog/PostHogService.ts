import Config from 'react-native-config'
import { JsonMap } from 'store/posthog/types'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { getPosthogDeviceInfo } from './utils'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'

const PostHogCaptureUrl = `${Config.POSTHOG_URL}/capture/`

const PostHogDecideUrl = `${Config.POSTHOG_URL}/decide?v=2`
const generatePostHogDecideFetchOptions = (distinctId: string) => {
  return {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
      distinct_id: distinctId,
      app_version: DeviceInfoService.getAppVersion()
    })
  }
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

  async identifyUser(distinctId: string) {
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

  async fetchFeatureFlags(distinctId: string) {
    try {
      Logger.info('fetching feature flags')
      const response = await fetch(
        PostHogDecideUrl,
        generatePostHogDecideFetchOptions(distinctId)
      )

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
