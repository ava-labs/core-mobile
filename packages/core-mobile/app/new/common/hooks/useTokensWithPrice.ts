import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  postV1TokenLookupWithPrice,
  type Caip2IdAddressPair,
  type InternalId,
  type TokenLookupWithPriceInfoResponse
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'

export type TokenWithPriceData =
  TokenLookupWithPriceInfoResponse['data'][string]

const STALE_TIME = 30 * 1000 // 30 seconds

const tokenToKey = (token: Caip2IdAddressPair | InternalId): string => {
  if ('internalId' in token) {
    return token.internalId.toLowerCase()
  }
  return `${token.caip2Id.toLowerCase()}:${token.address.toLowerCase()}`
}

/**
 * Fetches price and metadata for a list of tokens from the token aggregator.
 *
 * @param tokens - Array of token identifiers (CAIP-2 + address pairs or internal IDs).
 * @returns Flat array of token price data entries.
 */
export function useTokensWithPrice(
  tokens: Array<Caip2IdAddressPair | InternalId>
): TokenWithPriceData[] {
  // tokenKeys is the stable string representation of tokens for the query key.
  const tokenKeys = useMemo(() => tokens.map(tokenToKey), [tokens])

  const { data } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.TOKEN_LOOKUP_WITH_PRICE, tokenKeys],
    queryFn: async () => {
      const response = await postV1TokenLookupWithPrice({
        client: tokenAggregatorApi,
        body: { tokens }
      })
      return response.data?.data ?? {}
    },
    enabled: tokens.length > 0,
    staleTime: STALE_TIME
  })

  return data ? Object.values(data) : []
}
