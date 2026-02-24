import { TokensResponse } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
// Fusion SDK types - re-exported to abstract away the SDK dependency
export type { Quote } from '@avalabs/unified-asset-transfer'
export { ServiceType } from '@avalabs/unified-asset-transfer'

// Token Aggregator API types
export type ApiToken = TokensResponse['data'][number]
