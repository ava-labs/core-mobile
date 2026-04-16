import type { NetworkTokensByCaip2Response } from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import type { Transfer } from '@avalabs/fusion-sdk'

// Token Aggregator API types — now using v2 token shape
// v2 tokens include: internalId, address, name, symbol, isNative, logoUri, decimals, top250Rank, networkCaip2Id
export type ApiToken = NetworkTokensByCaip2Response['tokens'][number]

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
