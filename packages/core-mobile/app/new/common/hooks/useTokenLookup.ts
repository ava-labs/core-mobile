import { useQueries } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import {
  type Caip2IdAddressPair,
  type InternalId,
  type TokenInfo
} from 'utils/api/generated/tokenAggregator/aggregatorApi.client'
import { useMemo } from 'react'
import { tokenToKey } from 'common/utils/tokenLookup'
import { enqueueTokenLookup } from 'common/utils/tokenLookupQueue'

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
      queryFn: () => enqueueTokenLookup(token),
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
