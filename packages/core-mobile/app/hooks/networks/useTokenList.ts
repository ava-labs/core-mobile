import { UseQueryResult, useQuery } from '@tanstack/react-query'
import { queryClient } from 'contexts/ReactQueryProvider'
import Config from 'react-native-config'
import { NetworkContractToken } from '@avalabs/core-chains-sdk'

const QUERY_KEY = ['tokenList', 'solana']
const HOUR_IN_MS = 1000 * 60 * 60
const DAY_IN_MS = 1000 * 60 * 60 * 24

type TokenListResponse = Record<string, { tokens: NetworkContractToken[] }>

const fetchTokenListWithSolana = async (): Promise<TokenListResponse> => {
  const response = await fetch(`${Config.PROXY_URL}/tokenlist?includeSolana`)
  return response.json()
}

/** Fetches and caches token list for SVM networks. Returns full response for chainId-specific token extraction */
export const getCachedTokenList = async (): Promise<TokenListResponse> => {
  return queryClient.fetchQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchTokenListWithSolana,
    staleTime: HOUR_IN_MS,
    gcTime: DAY_IN_MS
  })
}

/** React hook for consuming token list data in UI components, filtered by chainId */
export const useTokenList = (
  chainId: string
): UseQueryResult<NetworkContractToken[], Error> => {
  return useQuery<TokenListResponse, Error, NetworkContractToken[]>({
    queryKey: QUERY_KEY,
    queryFn: fetchTokenListWithSolana,
    select: (data: TokenListResponse) => data[chainId]?.tokens ?? [],
    staleTime: HOUR_IN_MS,
    gcTime: DAY_IN_MS
  })
}
