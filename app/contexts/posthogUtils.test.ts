import { sanitizeFeatureFlags } from 'contexts/posthogUtils'

describe('app/contexts/posthogUtils.ts', () => {
  describe('sanitizeFeatureFlags', () => {
    it('filters only allowed keys from server response', () => {
      expect(
        sanitizeFeatureFlags({
          featureFlags: {
            'bridge-feature': true,
            'unknown-prop': true
          }
        })
      ).toStrictEqual({
        'bridge-feature': true
      })
    })
    it('returns empty object if there is no wrapping featureFlags prop', () => {
      expect(
        sanitizeFeatureFlags({
          'bridge-feature': true,
          'bridge-feature-btc': true,
          'bridge-feature-eth': true,
          events: true,
          everything: true,
          'send-feature': true,
          'sentry-sample-rate': '0.1',
          'swap-feature': true
        })
      ).toStrictEqual({})
    })
    it('returns empty object if server returns undefined result', () => {
      expect(sanitizeFeatureFlags(undefined)).toStrictEqual({})
    })
    it('returns empty object if server returns null result', () => {
      expect(sanitizeFeatureFlags(null)).toStrictEqual({})
    })
  })
})
