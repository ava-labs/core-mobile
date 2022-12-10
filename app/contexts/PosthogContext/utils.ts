import {
  FeatureGates,
  FeatureVars,
  PostHogDecideResponse,
  FeatureFlags
} from './types'

const allowedKeys: (FeatureGates | FeatureVars)[] = [
  ...Object.values(FeatureGates),
  ...Object.values(FeatureVars)
]
const featureVars = Object.values(FeatureVars) as string[]
const featureGates = Object.values(FeatureGates) as string[]

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

  return allowedKeys.reduce((acc, k) => {
    if (
      (featureVars.includes(k) && typeof value.featureFlags[k] === 'string') ||
      (featureGates.includes(k) && typeof value.featureFlags[k] === 'boolean')
    ) {
      acc[k] = value.featureFlags[k]
    }

    return acc
  }, {} as FeatureFlags)
}
