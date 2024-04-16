import { coerce, satisfies, validRange } from 'semver'
import DeviceInfoService from 'services/deviceInfo/DeviceInfoService'
import {
  FeatureGates,
  FeatureVars,
  FeatureFlags,
  PostHogDecideResponse
} from './types'

const allowedKeys: (FeatureGates | FeatureVars)[] = [
  ...Object.values(FeatureGates),
  ...Object.values(FeatureVars)
]
const featureVars = Object.values(FeatureVars) as string[]
const featureGates = Object.values(FeatureGates) as string[]

function isFeatureGate(key: string): key is FeatureGates {
  return featureGates.includes(key)
}

type AssertResponseFn = (
  value: unknown
) => asserts value is PostHogDecideResponse

const assertResponse: AssertResponseFn = value => {
  if (
    !value ||
    typeof value !== 'object' ||
    'featureFlags' in value === false ||
    typeof (value as PostHogDecideResponse).featureFlags !== 'object'
  ) {
    throw new Error('invalid response')
  }
}

export const sanitizeFeatureFlags = (value: unknown): FeatureFlags => {
  assertResponse(value)

  const rawFlags = allowedKeys.reduce((acc, k) => {
    if (
      (featureVars.includes(k) && typeof value.featureFlags[k] === 'string') ||
      (featureGates.includes(k) && typeof value.featureFlags[k] === 'boolean')
    ) {
      acc[k] = value.featureFlags[k]
    }

    return acc
  }, {} as FeatureFlags)

  if (value.featureFlagPayloads) {
    const appVersion = coerce(DeviceInfoService.getAppVersion())

    // If we don't know the current Core version, default to whatever was returned by the API
    if (!appVersion) {
      return rawFlags
    }

    const evaluatedFlags = Object.fromEntries(
      Object.entries(value.featureFlagPayloads)
        .filter(([flagName]) => isFeatureGate(flagName) && rawFlags[flagName]) // Only evaluate flags that are enabled
        .map(([flagName, payload]) => {
          let range = ''

          try {
            range = JSON.parse(payload)
          } catch {
            // If the payload is not JSON-parsable, default to disabled state.
            return [flagName, false]
          }

          const versionRange = validRange(range)

          // Default to disabled state if the payload string is not a valid semver range.
          if (!versionRange) {
            return [flagName, false]
          }

          return [flagName, satisfies(appVersion, versionRange)]
        })
    )

    return { ...rawFlags, ...evaluatedFlags }
  }

  return rawFlags
}
