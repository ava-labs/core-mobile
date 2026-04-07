import { useQueries } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  postV1TokenLookup,
  type Caip2IdAddressPair,
  type InternalId,
  type TokenInfo
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { tokenToKey } from './useTokensWithPrice'

export type { TokenInfo }

const STALE_TIME = 60 * 1000 // 60 seconds

export function useTokenLookup(
  tokens: Array<Caip2IdAddressPair | InternalId>
): { data: { [key: string]: TokenInfo }; isLoading: boolean } {
  return useQueries({
    queries: tokens.map(token => ({
      queryKey: [ReactQueryKeys.TOKEN_LOOKUP, tokenToKey(token)],
      queryFn: async () => {
        const response = await postV1TokenLookup({
          client: tokenAggregatorApi,
          body: { tokens: [token] }
        })
        return response.data?.data ?? {}
      },
      staleTime: STALE_TIME
    })),
    combine: results => ({
      data: results.reduce<{ [key: string]: TokenInfo }>(
        (acc, result) => ({ ...acc, ...result.data }),
        {}
      ),
      isLoading: results.some(r => r.isLoading)
    })
  })
}
