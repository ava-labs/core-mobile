import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import BridgeService from 'services/bridge/BridgeService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ReactQueryKeys } from 'consts/reactQueryKeys'

/**
 * Hook to manage bridge config with React Query caching and persistence
 * React Query automatically handles:
 * - In-memory caching with network separation (testnet/mainnet via query key)
 * - MMKV persistence across app restarts (configured in ReactQueryProvider)
 * - Cache invalidation when isDeveloperMode changes
 * - Automatic retrying and refetching
 */
export function useBridgeConfig(): UseQueryResult<BridgeConfig, Error> {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: [ReactQueryKeys.BRIDGE_CONFIG, isDeveloperMode],
    queryFn: async (): Promise<BridgeConfig> => {
      const config = await BridgeService.getConfig()

      if (!config) {
        throw new Error('Failed to fetch bridge config from API')
      }

      return config
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  })
}
