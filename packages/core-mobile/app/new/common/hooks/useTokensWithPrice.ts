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

/**
 * Fetches price and metadata for a list of tokens from the token aggregator.
 *
 * @param tokens - Array of token identifiers (CAIP-2 + address pairs or internal IDs).
 * @returns Flat array of token price data entries.
 */
export function useTokensWithPrice(
  tokens: Array<Caip2IdAddressPair | InternalId>
): TokenWithPriceData[] {
  const { data } = useQuery({
    queryKey: [ReactQueryKeys.TOKEN_LOOKUP_WITH_PRICE, tokens],
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
