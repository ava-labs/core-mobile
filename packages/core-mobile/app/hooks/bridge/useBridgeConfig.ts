import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import BridgeService from 'services/bridge/BridgeService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { usePathname } from 'expo-router'
import { selectBridgeTransactions } from 'store/bridge'
import Logger from 'utils/Logger'

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
  const bridgeTransactions = useSelector(selectBridgeTransactions)

  // Check if we're currently in bridge routes
  const currentRoute = usePathname()
  const isBridgeRoute = currentRoute.includes('/bridge')

  // Check if we have pending transactions that need tracking
  const hasPendingTransactions = Object.keys(bridgeTransactions).length > 0

  // Only enable if we're in bridge routes OR have pending transactions
  const shouldFetch = isBridgeRoute || hasPendingTransactions

  if (shouldFetch) {
    Logger.info('[Bridge Config] Fetching bridge config')
  } else {
    Logger.info('[Bridge Config] Not fetching bridge config')
  }

  return useQuery({
    queryKey: [ReactQueryKeys.BRIDGE_CONFIG, isDeveloperMode],
    queryFn: async (): Promise<BridgeConfig> => {
      const config = await BridgeService.getConfig()

      if (!config) {
        throw new Error('Failed to fetch bridge config from API')
      }

      return config
    },
    enabled: shouldFetch, // 🔥 Smart conditional fetching
    staleTime: 5 * 60 * 1000,
    refetchInterval: shouldFetch ? 15 * 1000 : false, // Only refetch when needed
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  })
}
