import { coerce, satisfies, validRange } from 'semver'
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

export const sanitizeFeatureFlags = (
  value: unknown,
  appVersion?: string
): FeatureFlags => {
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
    const version = coerce(appVersion)

    // If we don't know the current Core version, default to whatever was returned by the API
    if (!version) {
      return rawFlags
    }

    const evaluatedFlags = Object.fromEntries(
      Object.entries(value.featureFlagPayloads)
        .filter(([flagName]) => isFeatureGate(flagName) && rawFlags[flagName]) // Only evaluate flags that are enabled
        .map(([_flagName, payload]) => {
          const flagName = _flagName as FeatureGates

          try {
            const range = JSON.parse(payload)

            const versionRange = validRange(range)

            // Default to disabled state if the payload string is not a valid semver range.
            if (!versionRange) {
              return [flagName, false]
            }

            return [flagName, satisfies(version, versionRange)]
          } catch {
            return [flagName, false]
          }
        })
    )

    return { ...rawFlags, ...evaluatedFlags }
  }

  return rawFlags
}
