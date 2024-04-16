import mockRNDeviceInfo from 'react-native-device-info/jest/react-native-device-info-mock'
import { sanitizeFeatureFlags } from './sanitizeFeatureFlags'
import { FeatureFlags, FeatureGates } from './types'

jest.mock('react-native-device-info', () => mockRNDeviceInfo)
jest.spyOn(mockRNDeviceInfo, 'hasNotch').mockReturnValue(false)

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
        jest.spyOn(mockRNDeviceInfo, 'getVersion').mockReturnValue('1.0.0')
        beforeEach(() => {
          featureFlags = sanitizeFeatureFlags({
            featureFlags: {
              [FeatureGates.DEFI]: true,
              [FeatureGates.SEND]: true,
              [FeatureGates.SWAP]: false
            },
            featureFlagPayloads: {
              [FeatureGates.DEFI]: JSON.stringify('a.b.c')
            }
          })
        })
        it('the version-specific feature flag should be disabled', () => {
          expect(featureFlags[FeatureGates.DEFI]).toBe(false)
        })
        it('the basic feature flags are left in-tact', () => {
          expect(featureFlags[FeatureGates.SEND]).toBe(true)
          expect(featureFlags[FeatureGates.SWAP]).toBe(false)
        })
      })

      /*describe('and the payload is a valid semver range', () => {
        it.each([
          {
            coreVersion: '1.32.8',
            flagVersionRange: '^1.32',
            isEnabled: true
          },
          {
            coreVersion: '1.34.8',
            flagVersionRange: '^1.32',
            isEnabled: true
          }
          {
            coreVersion: '1.32.8',
            flagVersionRange: '~1.32',
            isEnabled: true
          },
          {
            coreVersion: '1.33.0',
            flagVersionRange: '~1.32',
            isEnabled: false
          },
          {
            coreVersion: '1.40.8',
            flagVersionRange: '>=1.33.7',
            isEnabled: true
          },
          {
            coreVersion: '1.40.8',
            flagVersionRange: '1.33.x',
            isEnabled: false
          },
          {
            coreVersion: '1.40.8',
            flagVersionRange: '1.40.x',
            isEnabled: true
          },
          {
            coreVersion: '1.40.8',
            flagVersionRange: '1.33 - 1.41',
            isEnabled: true
          },
          {
            coreVersion: '1.32.8',
            flagVersionRange: '1.33 - 1.41',
            isEnabled: false
          },
          {
            coreVersion: '1.32.8',
            flagVersionRange: '1.32 || 1.33',
            isEnabled: true
          },
          {
            coreVersion: '1.99.99',
            flagVersionRange: '^2',
            isEnabled: false
          },
          {
            coreVersion: '2.0.0',
            flagVersionRange: '^2',
            isEnabled: true
          }
        ])(
          'enables the feature flag if current Core version satisfies configured range',
          async ({ coreVersion, flagVersionRange, isEnabled }) => {
            jest
              .spyOn(mockRNDeviceInfo, 'getVersion')
              .mockReturnValue(coreVersion)

            const featureFlags = sanitizeFeatureFlags({
              featureFlags: {
                [FeatureGates.BRIDGE]: false,
                [FeatureGates.DEFI]: true,
                [FeatureGates.SEND]: true,
                [FeatureGates.SWAP]: false
              },
              featureFlagPayloads: {
                [FeatureGates.BRIDGE]: JSON.stringify(flagVersionRange),
                [FeatureGates.DEFI]: JSON.stringify(flagVersionRange)
              }
            })

            await new Promise(process.nextTick)

            expect(featureFlags).toEqual({
              [FeatureGates.BRIDGE]: false, // Comes disabled, should stay disabled even though it has a version attached.
              [FeatureGates.DEFI]: isEnabled, // Comes enabled with a payload, gotta be matched against the current version
              [FeatureGates.SEND]: true, // Comes without a payload, should stay in-tact
              [FeatureGates.SWAP]: false // Comes without a payload, should stay in-tact
            })
          }
        )
      })*/
    })
  })
})
