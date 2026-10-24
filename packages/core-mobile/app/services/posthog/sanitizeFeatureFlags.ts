/* eslint-disable sonarjs/cognitive-complexity */
import { coerce, satisfies, validRange } from 'semver'
import {
  FeatureGates,
  FeatureVars,
  FeatureFlags,
  FeatureFlagPayloads,
  PostHogDecideResponse
} from './types'

const allowedKeys: (FeatureGates | FeatureVars)[] = [
  ...Object.values(FeatureGates),
  ...Object.values(FeatureVars)
]
const featureVars = Object.values(FeatureVars) as string[]
const featureGates = Object.values(FeatureGates) as string[]

// Gates that may arrive as a multivariate variant string instead of a plain
// boolean — the variant carries a value (convenience-fee rate in basis
// points) on top of acting as the on/off switch. See `FeatureGates`.
const variantGates: string[] = [
  FeatureGates.FAST_STAKE_FEE_ENABLED,
  FeatureGates.DELEGATION_FEE_ENABLED
]

// Gates whose payload is feature config rather than the app-version range
// every other gate payload is evaluated as.
const configPayloadGates: string[] = [
  FeatureGates.LEDGER_AVALANCHE_APP_RECOMMENDED_VERSION
]

function isFeatureGate(key: string): key is FeatureGates {
  return featureGates.includes(key)
}

function isVersionRangeGate(key: string): key is FeatureGates {
  return isFeatureGate(key) && !configPayloadGates.includes(key)
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
  appVersion?: string,
  isE2E?: boolean
): FeatureFlags => {
  assertResponse(value)

  const rawFlags = allowedKeys.reduce((acc, k) => {
    if (
      (featureVars.includes(k) && typeof value.featureFlags[k] === 'string') ||
      (featureGates.includes(k) &&
        typeof value.featureFlags[k] === 'boolean') ||
      (variantGates.includes(k) && typeof value.featureFlags[k] === 'string')
    ) {
      acc[k] = value.featureFlags[k]
    }

    return acc
  }, {} as FeatureFlags)

  if (value.featureFlagPayloads) {
    if (isE2E) return rawFlags

    const version = coerce(appVersion)

    // If we don't know the current Core version, default to whatever was returned by the API
    if (!version) {
      return rawFlags
    }

    const evaluatedFlags = Object.fromEntries(
      Object.entries(value.featureFlagPayloads)
        .filter(
          ([flagName]) => isVersionRangeGate(flagName) && rawFlags[flagName]
        ) // Only evaluate flags that are enabled
        .map(([_flagName, payload]) => {
          const flagName = _flagName as FeatureGates

          try {
            const range = JSON.parse(payload)

            const versionRange = validRange(range)

            // Default to disabled state if the payload string is not a valid semver range.
            if (!versionRange) {
              return [flagName, false]
            }

            // Preserve the raw flag value (a variant string for the
            // multivariate gates, `true` otherwise) when the version
            // qualifies — collapsing it to a boolean would drop the value
            // the variant carries.
            return [
              flagName,
              satisfies(version, versionRange) && rawFlags[flagName]
            ]
          } catch {
            return [flagName, false]
          }
        })
    )

    return { ...rawFlags, ...evaluatedFlags }
  }

  return rawFlags
}

/**
 * Extracts the JSON-decoded payloads of `configPayloadGates`. /decide serves
 * payloads JSON-encoded; an already-decoded object is accepted as well.
 * Undecodable payloads are dropped.
 */
export const sanitizeFeatureFlagPayloads = (
  value: unknown
): FeatureFlagPayloads => {
  assertResponse(value)

  const payloads: Record<string, unknown> = value.featureFlagPayloads ?? {}

  return configPayloadGates.reduce((acc, key) => {
    const raw = payloads[key]
    if (raw === undefined || raw === null) return acc

    if (typeof raw !== 'string') {
      acc[key as FeatureGates] = raw
      return acc
    }

    try {
      acc[key as FeatureGates] = JSON.parse(raw)
    } catch {
      // malformed payload: treated as absent
    }
    return acc
  }, {} as FeatureFlagPayloads)
}
