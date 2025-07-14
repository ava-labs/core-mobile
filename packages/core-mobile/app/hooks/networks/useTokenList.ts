import { UseQueryResult, useQuery } from '@tanstack/react-query'
import Config from 'react-native-config'
import Logger from 'utils/Logger'

const QUERY_KEY = ['tokenList', 'solana']

const HOUR_IN_MS = 1000 * 60 * 60
const DAY_IN_MS = 1000 * 60 * 60 * 24

export const useTokenList = (
  chainId: string
): UseQueryResult<string[], Error> => {
  return useQuery({
    queryKey: [...QUERY_KEY, chainId],
    queryFn: async () => {
      try {
        const response = await fetch(
          `${Config.PROXY_URL}/tokenlist?includeSolana`
        )
        const data = await response.json()
        return data[chainId]?.tokens || []
      } catch (error) {
        Logger.error('Failed to fetch SPL token metadata', error)
        return []
      }
    },
    // Cache for 1 hour
    staleTime: HOUR_IN_MS,
    // Keep unused data in cache for 24 hours
    gcTime: DAY_IN_MS
  })
}
