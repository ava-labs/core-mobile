import { useQueries } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  postV1TokenLookup,
  type Caip2IdAddressPair,
  type InternalId,
  type TokenInfo
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { tokenAggregatorApi } from 'utils/api/clients/aggregatedTokensApiClient'
import { useMemo } from 'react'
import { tokenToKey } from './useTokensWithPrice'

export type { TokenInfo }

const STALE_TIME = 60 * 1000 // 60 seconds

export function useTokenLookup(
  tokens: Array<Caip2IdAddressPair | InternalId>
): { data: { [key: string]: TokenInfo }; isLoading: boolean } {
  const uniqueTokens = useMemo(() => {
    const seen = new Set<string>()
    return tokens.filter(token => {
      const key = tokenToKey(token)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [tokens])

  return useQueries({
    queries: uniqueTokens.map(token => ({
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
      data: results.reduce<{ [key: string]: TokenInfo }>((acc, result) => {
        Object.assign(acc, result.data)
        return acc
      }, {}),
      isLoading: results.some(r => r.isLoading)
    })
  })
}
