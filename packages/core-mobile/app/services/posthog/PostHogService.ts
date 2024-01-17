import Config from 'react-native-config'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'

const PostHogDecideUrl = `${Config.POSTHOG_URL}/decide?v=2`

class PostHogService {
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  async fetchFeatureFlags(distinctId: string) {
    try {
      Logger.info('fetching feature flags')
      const response = await fetch(PostHogDecideUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          api_key: Config.POSTHOG_FEATURE_FLAGS_KEY,
          distinct_id: distinctId,
          app_version: DeviceInfoService.getAppVersion()
        })
      })

      if (!response.ok) {
        throw new Error('Something went wrong')
      }

      const responseJson = await response.json()
      const featureFlags = sanitizeFeatureFlags(responseJson)

      Logger.info('fetched feature flags', featureFlags)

      return featureFlags
    } catch (e) {
      Logger.error('failed to fetch feature flags', e)
    }
  }
}

export default new PostHogService()
