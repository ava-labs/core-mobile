import { FeatureGates, FeatureVars } from 'contexts/types'

// posthog response can be an empty object when all features are disabled
// thus, we need to use Partial
export type PostHogDecideResponse = {
  featureFlags: Partial<Record<FeatureGates | FeatureVars, boolean | string>>
}

export type FeatureFlags = PostHogDecideResponse['featureFlags']
