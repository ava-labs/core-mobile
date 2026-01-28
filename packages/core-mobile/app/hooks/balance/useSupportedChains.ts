import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { queryClient } from 'contexts/ReactQueryProvider'
import { getV1BalanceGetSupportedChains } from 'utils/apiClient/generated/balanceApi.client'
import { balanceApiClient } from 'utils/api/clients/balanceApiClient'

const STALE_TIME = 5 * 60 * 1000 // 5 minutes

/**
 * Fetches supported chain IDs from the balance API
 */
const fetchSupportedChains = async (): Promise<string[]> => {
  const result = await getV1BalanceGetSupportedChains({
    client: balanceApiClient
  })

  if (result.error || !result.data) {
    throw new Error('Failed to fetch supported chains')
  }

  return result.data.caip2Ids
}

/**
 * React Query hook for fetching supported chains.
 * Use this in React components.
 */
export const useSupportedChains = (): UseQueryResult<string[], Error> => {
  return useQuery({
    queryKey: [ReactQueryKeys.BALANCE_SUPPORTED_CHAINS],
    queryFn: fetchSupportedChains,
    staleTime: STALE_TIME
  })
}

/**
 * Fetches supported chains from cache or network.
 * Use this in services/non-React code.
 *
 * Uses queryClient.fetchQuery which:
 * - Returns cached data if fresh (within staleTime)
 * - Fetches from network if stale or missing
 * - Deduplicates concurrent requests automatically
 */
export const getSupportedChainsFromCache = async (): Promise<
  string[] | undefined
> => {
  try {
    return await queryClient.fetchQuery({
      queryKey: [ReactQueryKeys.BALANCE_SUPPORTED_CHAINS],
      queryFn: fetchSupportedChains,
      staleTime: STALE_TIME
    })
  } catch {
    // Return undefined on error to maintain backward compatibility
    return undefined
  }
}
