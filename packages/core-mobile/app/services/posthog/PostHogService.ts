import Config from 'react-native-config'
import Logger from 'utils/Logger'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import { JsonMap } from 'store/posthog'
import { applyTempChainIdConversion } from 'utils/caip2ChainIds'
import { PostHogServiceNoop } from 'services/posthog/PostHogServiceNoop'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'
import {
  FeatureGates,
  FeatureVars,
  PostHogDecideResponse,
  PostHogServiceInterface
} from './types'
import { getPosthogDeviceInfo } from './utils'

class PostHogService implements PostHogServiceInterface {
  #posthogCaptureUrl: string

  constructor(
    private posthogAnalyticsKey: string,
    private posthogUrl: string,
    private posthogFeatureFlagsKey: string
  ) {
    this.#posthogCaptureUrl = `${posthogUrl}/capture/`
  }

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

    applyTempChainIdConversion(properties)

    const deviceInfo = await getPosthogDeviceInfo()
    const PostHogCaptureFetchOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: this.posthogAnalyticsKey,
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
    fetch(this.#posthogCaptureUrl, PostHogCaptureFetchOptions)
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
        api_key: this.posthogFeatureFlagsKey,
        event: '$identify',
        timestamp: Date.now().toString(),
        ip: '',
        distinct_id: distinctId,
        $set: {
          $app_version: DeviceInfoService.getAppVersion()
        }
      })
    }
    fetch(this.#posthogCaptureUrl, PostHogIdentifyFetchOptions)
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
    const appVersion = DeviceInfoService.getAppVersion()

    const fetchWithPosthogFallback =
      async (): Promise<PostHogDecideResponse> => {
        const fetcher = async (url: string): Promise<PostHogDecideResponse> => {
          const params = new URLSearchParams({
            ip: '',
            _: Date.now().toString(),
            v: '3',
            ver: appVersion
          })

          const data = Buffer.from(
            JSON.stringify({
              token: this.posthogFeatureFlagsKey,
              distinct_id: distinctId,
              groups: {}
            })
          ).toString('base64')

          const response = await fetch(`${url}/decide?${params}`, {
            method: 'POST',
            body: 'data=' + encodeURIComponent(data),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
          })

          return await response.json()
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
          if (!this.posthogUrl) {
            throw new Error('Invalid Posthog URL')
          }

          return await fetcher(this.posthogUrl)
        }
      }

    try {
      const responseJson = await fetchWithPosthogFallback()

      return sanitizeFeatureFlags(responseJson, appVersion)
    } catch (e) {
      Logger.error('failed to fetch feature flags', e)
    }
  }
}

export default Config.POSTHOG_ANALYTICS_KEY &&
Config.POSTHOG_URL &&
Config.POSTHOG_FEATURE_FLAGS_KEY
  ? new PostHogService(
      Config.POSTHOG_ANALYTICS_KEY,
      Config.POSTHOG_URL,
      Config.POSTHOG_FEATURE_FLAGS_KEY
    )
  : new PostHogServiceNoop()
