import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'
import { FeatureFlags, FeatureGates } from './types'

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

    it('returns empty object if server returns empty featureFlags object', () => {
      expect(
        sanitizeFeatureFlags({
          featureFlags: {}
        })
      ).toStrictEqual({})
    })

    describe('invalid response', () => {
      it('throws error if there is no wrapping featureFlags prop', () => {
        expect(() =>
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
        ).toThrow('invalid response')
      })
      it('throws error if the featureFlags prop is not an object', () => {
        expect(() =>
          sanitizeFeatureFlags({
            featureFlags: true
          })
        ).toThrow('invalid response')
      })
      it('throws error if server returns undefined result', () => {
        expect(() => sanitizeFeatureFlags(undefined)).toThrow(
          'invalid response'
        )
      })
      it('throws error if server returns null result', () => {
        expect(() => sanitizeFeatureFlags(null)).toThrow('invalid response')
      })
    })

    describe('when a feature flag arrives with a custom payload', () => {
      describe('but the payload is not a valid semver range', () => {
        let featureFlags: FeatureFlags
        beforeEach(() => {
          featureFlags = sanitizeFeatureFlags(
            {
              featureFlags: {
                [FeatureGates.SOLANA_SUPPORT]: true,
                [FeatureGates.SWAP]: false
              },
              featureFlagPayloads: {
                [FeatureGates.SOLANA_SUPPORT]: JSON.stringify('a.b.c')
              }
            },
            '1.0.0'
          )
        })
        it('the version-specific feature flag should be disabled', () => {
          expect(featureFlags[FeatureGates.SOLANA_SUPPORT]).toBe(false)
        })
        it('the basic feature flags are left in-tact', () => {
          expect(featureFlags[FeatureGates.SWAP]).toBe(false)
        })
      })

      describe('and the payload is a valid semver range', () => {
        it.each([
          {
            appVersion: '1.32.8',
            featureFlagPayloads: '^1.32',
            isEnabled: true
          },
          {
            appVersion: '1.34.8',
            featureFlagPayloads: '^1.32',
            isEnabled: true
          },
          {
            appVersion: '1.32.8',
            featureFlagPayloads: '~1.32',
            isEnabled: true
          },
          {
            appVersion: '1.33.0',
            featureFlagPayloads: '~1.32',
            isEnabled: false
          },
          {
            appVersion: '1.40.8',
            featureFlagPayloads: '>=1.33.7',
            isEnabled: true
          },
          {
            appVersion: '1.40.8',
            featureFlagPayloads: '1.33.x',
            isEnabled: false
          },
          {
            appVersion: '1.40.8',
            featureFlagPayloads: '1.40.x',
            isEnabled: true
          },
          {
            appVersion: '1.40.8',
            featureFlagPayloads: '1.33 - 1.41',
            isEnabled: true
          },
          {
            appVersion: '1.32.8',
            featureFlagPayloads: '1.33 - 1.41',
            isEnabled: false
          },
          {
            appVersion: '1.32.8',
            featureFlagPayloads: '1.32 || 1.33',
            isEnabled: true
          },
          {
            appVersion: '1.99.99',
            featureFlagPayloads: '^2',
            isEnabled: false
          },
          {
            appVersion: '2.0.0',
            featureFlagPayloads: '^2',
            isEnabled: true
          }
        ])(
          'enables the feature flag if current Core version satisfies configured range',
          async ({ appVersion, featureFlagPayloads, isEnabled }) => {
            const featureFlags = sanitizeFeatureFlags(
              {
                featureFlags: {
                  [FeatureGates.BRIDGE]: false,
                  [FeatureGates.SOLANA_SUPPORT]: true,
                  [FeatureGates.SWAP]: false
                },
                featureFlagPayloads: {
                  [FeatureGates.BRIDGE]: JSON.stringify(featureFlagPayloads),
                  [FeatureGates.SOLANA_SUPPORT]:
                    JSON.stringify(featureFlagPayloads)
                }
              },
              appVersion
            )

            expect(featureFlags).toEqual({
              [FeatureGates.BRIDGE]: false, // Comes disabled, should stay disabled even though it has a version attached.
              [FeatureGates.SOLANA_SUPPORT]: isEnabled, // Comes enabled with a payload, gotta be matched against the current version
              [FeatureGates.SWAP]: false // Comes without a payload, should stay in-tact
            })
          }
        )
      })
    })
  })
})
