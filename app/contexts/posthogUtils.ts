import { FeatureGates, FeatureVars } from 'contexts/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function sanitizeFeatureFlags(value: any) {
  const allowedKeys: (FeatureGates | FeatureVars)[] = [
    ...Object.values(FeatureGates),
    ...Object.values(FeatureVars)
  ]

  return allowedKeys.reduce((acc, k) => {
    if (
      (Object.values(FeatureVars) as string[]).includes(k) &&
      typeof value?.featureFlags?.[k] === 'string'
    ) {
      acc[k] = value.featureFlags[k]
    } else if (
      (Object.values(FeatureGates) as string[]).includes(k) &&
      typeof value?.featureFlags?.[k] === 'boolean'
    ) {
      acc[k] = value.featureFlags[k]
    }
    return acc
  }, {} as Record<FeatureGates | FeatureVars, boolean | string>)
}
