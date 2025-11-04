// @ts-ignore
import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'
import Config from 'react-native-config'
import PostHogService from './PostHogService'
import { FeatureGates } from './types'

const mockFetch = jest.fn()
const appVersion = '1.59.0'

jest.mock('react-native-device-info', () => mockRNDeviceInfo)
jest.spyOn(mockRNDeviceInfo, 'getVersion').mockReturnValue(appVersion)

describe('PostHogService', () => {
  describe('fetchFeatureFlags', () => {
    beforeEach(() => {
      jest.clearAllMocks()
      jest.spyOn(global, 'fetch').mockImplementation(mockFetch)
    })

    it('returns feature flags as is when no payload is provided', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            featureFlags: {
              [FeatureGates.SOLANA_SUPPORT]: false,
              [FeatureGates.BRIDGE]: true
            }
          }),
        ok: true,
        status: 200
      })

      const flags = await PostHogService.fetchFeatureFlags('distinctId')

      expect(flags).toEqual({
        [FeatureGates.SOLANA_SUPPORT]: false,
        [FeatureGates.BRIDGE]: true
      })
    })

    it('returns feature flags as false when the version range in payload is not satisfied', async () => {
      mockFetch.mockResolvedValue({
        json: () =>
          Promise.resolve({
            featureFlags: {
              [FeatureGates.SOLANA_SUPPORT]: true,
              [FeatureGates.BRIDGE]: true
            },
            featureFlagPayloads: { [FeatureGates.BRIDGE]: '>=1.60.0' }
          }),
        ok: true,
        status: 200
      })

      const flags = await PostHogService.fetchFeatureFlags('distinctId')

      expect(flags).toEqual({
        [FeatureGates.SOLANA_SUPPORT]: true,
        [FeatureGates.BRIDGE]: false
      })
    })
  })

  describe('cached value from proxy api', () => {
    it('properly calls proxy api', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1234)

      const json_data = JSON.stringify({
        token: Config.POSTHOG_FEATURE_FLAGS_KEY,
        distinct_id: 'distinctId',
        groups: {}
      })

      const data = Buffer.from(json_data).toString('base64')

      await PostHogService.fetchFeatureFlags('distinctId')

      expect(fetch).toHaveBeenCalledTimes(1)
      expect(fetch).toHaveBeenCalledWith(
        `${process.env.PROXY_URL}/proxy/posthog/decide?ip=&_=1234&v=3&ver=${appVersion}`,
        {
          body: 'data=' + encodeURIComponent(data),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST'
        }
      )
    })
  })

  describe('directly from posthog api', () => {
    beforeEach(() => {
      global.fetch = jest
        .fn()
        .mockRejectedValueOnce(new Error('some error'))
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue({
            featureFlags: { [FeatureGates.BRIDGE]: false },
            featureFlagPayloads: { [FeatureGates.SOLANA_SUPPORT]: '>=1.60.0' }
          })
        })
    })

    it('properly calls posthog api', async () => {
      jest.spyOn(Date, 'now').mockReturnValue(1234)

      const json_data = JSON.stringify({
        token: Config.POSTHOG_FEATURE_FLAGS_KEY,
        distinct_id: 'distinctId',
        groups: {}
      })

      const data = Buffer.from(json_data).toString('base64')

      await PostHogService.fetchFeatureFlags('distinctId')

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        `${process.env.PROXY_URL}/proxy/posthog/decide?ip=&_=1234&v=3&ver=${appVersion}`,
        {
          body: 'data=' + encodeURIComponent(data),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST'
        }
      )
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        `${Config.POSTHOG_URL}/decide?ip=&_=1234&v=3&ver=${appVersion}`,
        {
          body: 'data=' + encodeURIComponent(data),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          method: 'POST'
        }
      )
    })
  })
})
