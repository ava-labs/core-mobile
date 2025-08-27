import { useQuery, UseQueryResult } from '@tanstack/react-query'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import { bridgeConfigCache } from 'services/bridge/BridgeConfigCache'
import BridgeService from 'services/bridge/BridgeService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import Logger from 'utils/Logger'

/**
 * Hook to manage bridge config with React Query caching and MMKV persistence
 * Uses React Query for in-memory caching and automatic refetching
 * Uses MMKV for persistent caching across app restarts
 * Automatically switches between testnet and mainnet configurations based on isDeveloperMode
 */
export function useBridgeConfig(): UseQueryResult<BridgeConfig, Error> {
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  return useQuery({
    queryKey: [ReactQueryKeys.BRIDGE_CONFIG, isDeveloperMode],
    queryFn: async (): Promise<BridgeConfig> => {
      // Try MMKV cache first for faster initial load
      const cachedConfig = bridgeConfigCache.getConfig(isDeveloperMode)
      if (cachedConfig) {
        Logger.info('[Bridge Config] Using cached config from MMKV')
        return cachedConfig
      }

      // Fetch fresh config from API
      Logger.info('[Bridge Config] Fetching fresh config from API')
      const freshConfig = await BridgeService.getConfig()

      if (!freshConfig) {
        throw new Error('Failed to fetch bridge config from API')
      }

      // Cache the fresh config in MMKV for persistence
      bridgeConfigCache.setConfig(freshConfig, isDeveloperMode)

      return freshConfig
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchInterval: 15 * 1000, // Refetch every 15 seconds
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
  })
}
