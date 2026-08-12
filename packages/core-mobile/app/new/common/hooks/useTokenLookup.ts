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

// The server's canonical address casing: EVM (`eip155:`) addresses are
// lowercased, Solana addresses are case-sensitive base58 and kept verbatim --
// a lowercased Solana address returns no results (confirmed against the live
// endpoint). Use this for both request bodies and response-map keys so the
// two can never disagree.
export function normalizeLookupAddress(
  caip2Id: string,
  address: string
): string {
  return caip2Id.toLowerCase().startsWith('eip155:')
    ? address.toLowerCase()
    : address
}

// Builds the token-aggregator's `/v1/token/lookup` response-map key
// (`data.data` is keyed as `{caip2Id}-{address}`, address cased per
// normalizeLookupAddress above).
export function tokenLookupKey(caip2Id: string, address: string): string {
  const normalizedCaip2Id = caip2Id.toLowerCase().startsWith('eip155:')
    ? caip2Id.toLowerCase()
    : caip2Id
  return `${normalizedCaip2Id}-${normalizeLookupAddress(caip2Id, address)}`
}

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
