import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
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

const STALE_TIME = 30 * 1000 // 30 seconds

export function useTokenLookup(
  tokens: Array<Caip2IdAddressPair | InternalId>
): { data: { [key: string]: TokenInfo }; isLoading: boolean } {
  const tokenKeys = useMemo(() => tokens.map(tokenToKey), [tokens])

  const { data, isLoading } = useQuery({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: [ReactQueryKeys.TOKEN_LOOKUP, tokenKeys],
    queryFn: async () => {
      const response = await postV1TokenLookup({
        client: tokenAggregatorApi,
        body: { tokens }
      })
      return response.data?.data ?? {}
    },
    enabled: tokens.length > 0,
    staleTime: STALE_TIME
  })

  return { data: data ?? {}, isLoading }
}
