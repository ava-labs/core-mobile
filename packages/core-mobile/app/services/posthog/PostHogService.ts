import Config from 'react-native-config'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { JsonMap } from 'store/posthog'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'
import { FeatureGates, FeatureVars, PostHogDecideResponse } from './types'
import { getPosthogDeviceInfo } from './utils'

const PostHogCaptureUrl = `${Config.POSTHOG_URL}/capture/`

class PostHogService {
  distinctId: string | undefined
  userId: string | undefined

  configure({
    distinctId,
    userId
  }: {
    distinctId: string
    userId: string
  }): void {
    this.distinctId = distinctId
    this.userId = userId
  }

  get isConfigured(): boolean {
    return this.distinctId !== undefined && this.userId !== undefined
  }

  async capture(eventName: string, properties?: JsonMap): Promise<void> {
    if (!this.isConfigured) {
      throw new Error(
        'PostHogService not configured. please call configure() first'
      )
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
          ...properties,
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

  async fetchFeatureFlags(
    distinctId: string
  ): Promise<
    Partial<Record<FeatureGates | FeatureVars, string | boolean>> | undefined
  > {
    const json_data = JSON.stringify({
      token: Config.POSTHOG_FEATURE_FLAGS_KEY,
      distinct_id: distinctId,
      groups: {}
    })

    const data = Buffer.from(json_data).toString('base64')

    const appVersion = DeviceInfoService.getAppVersion()

    const fetchWithPosthogFallback =
      async (): Promise<PostHogDecideResponse> => {
        const fetcher = async (url: string): Promise<PostHogDecideResponse> => {
          const params = new URLSearchParams({
            ip: '0',
            _: Date.now().toString(),
            v: '3',
            ver: appVersion
          })

          return await (
            await fetch(`${url}/decide?${params}`, {
              method: 'POST',
              body: 'data=' + encodeURIComponent(data),
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            })
          ).json()
        }

        try {
          const response = await fetcher(
            `${process.env.PROXY_URL}/proxy/posthog`
          )

          if (!response.featureFlags) {
            throw new Error('No feature flags found in cached response')
          }

          return response
        } catch (e) {
          if (!Config.POSTHOG_URL) {
            throw new Error('Invalid Posthog URL')
          }

          return await fetcher(Config.POSTHOG_URL)
        }
      }

    Logger.info('fetching feature flags')

    try {
      const responseJson = await fetchWithPosthogFallback()
      const featureFlags = sanitizeFeatureFlags(
        responseJson,
        DeviceInfoService.getAppVersion()
      )

      Logger.info('fetched feature flags', featureFlags)

      return featureFlags
    } catch (e) {
      Logger.error('failed to fetch feature flags', e)
    }
  }
}

export default new PostHogService()
