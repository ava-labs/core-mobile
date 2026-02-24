import { TokensResponse } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import type { Transfer } from '@avalabs/unified-asset-transfer'

// Token Aggregator API types
export type ApiToken = TokensResponse['data'][number]

// Fusion transfer storage types
export type FusionTransfer = {
  transfer: Transfer
  fromToken: {
    localId: string
    internalId?: string
    logoUri?: string
  }
  toToken: {
    localId: string
    internalId?: string
    logoUri?: string
  }
  timestamp: number
}

export type FusionTransfersMap = Record<string, FusionTransfer>

export type { Quote, Transfer } from '@avalabs/unified-asset-transfer'
export { ServiceType } from '@avalabs/unified-asset-transfer'
