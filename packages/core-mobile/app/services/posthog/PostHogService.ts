import Config from 'react-native-config'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'
import { FeatureGates, FeatureVars } from './types'

const PostHogDecideUrl = `${Config.POSTHOG_URL}/decide?v=2`

class PostHogService {
  async fetchFeatureFlags(
    distinctId: string
  ): Promise<
    Partial<Record<FeatureGates | FeatureVars, string | boolean>> | undefined
  > {
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
