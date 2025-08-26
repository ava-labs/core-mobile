import { useEffect, useState } from 'react'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import { bridgeConfigCache } from 'services/bridge/BridgeConfigCache'
import BridgeService from 'services/bridge/BridgeService'
import { useSelector } from 'react-redux'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import Logger from 'utils/Logger'

/**
 * Hook to manage bridge config with MMKV caching
 * Replaces Redux-based bridge config with more efficient MMKV storage
 */
export function useBridgeConfig() {
  const [config, setConfig] = useState<BridgeConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const isDeveloperMode = useSelector(selectIsDeveloperMode)

  const fetchConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Try cache first
      const cachedConfig = bridgeConfigCache.getConfig()
      if (cachedConfig) {
        setConfig(cachedConfig)
        setIsLoading(false)
        return
      }

      // Fetch fresh config
      Logger.info('[Bridge Config] Fetching fresh config')
      const freshConfig = await BridgeService.getConfig()

      if (freshConfig) {
        bridgeConfigCache.setConfig(freshConfig)
        setConfig(freshConfig)
      }
    } catch (err) {
      const error = err as Error
      Logger.error('Failed to fetch bridge config', error)
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load and developer mode changes
  useEffect(() => {
    // Clear cache when developer mode changes
    bridgeConfigCache.clearConfig()
    fetchConfig()
  }, [isDeveloperMode])

  // Periodic refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConfig()
    }, 15000)

    return () => clearInterval(interval)
  }, [])

  return {
    config,
    isLoading,
    error,
    refetch: fetchConfig
  }
}
