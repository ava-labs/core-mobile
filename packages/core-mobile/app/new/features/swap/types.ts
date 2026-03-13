import { TokensResponse } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import type { Transfer } from '@avalabs/fusion-sdk'

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

export type { Quote, Transfer } from '@avalabs/fusion-sdk'
export { ServiceType } from '@avalabs/fusion-sdk'
