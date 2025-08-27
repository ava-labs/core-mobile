import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import Logger from 'utils/Logger'
import { queryStorage } from 'utils/mmkv/storages'

/**
 * MMKV-based bridge config cache to replace Redux storage
 * This eliminates Redux rehydration overhead and improves app startup time
 * Uses the shared queryStorage for consistency with other cached data
 * Maintains separate caches for testnet and mainnet configurations
 */
class BridgeConfigCache {
  private static readonly STORAGE_KEY_PREFIX = 'bridge_config'
  private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  private getStorageKey(isDeveloperMode: boolean): string {
    return `${BridgeConfigCache.STORAGE_KEY_PREFIX}_${
      isDeveloperMode ? 'testnet' : 'mainnet'
    }`
  }

  /**
   * Store bridge config in MMKV with timestamp
   */
  setConfig(config: BridgeConfig, isDeveloperMode: boolean): void {
    try {
      const cacheEntry = {
        config,
        timestamp: Date.now()
      }
      queryStorage.set(
        this.getStorageKey(isDeveloperMode),
        JSON.stringify(cacheEntry)
      )
      Logger.info('[Bridge Config] Cached config in MMKV')
    } catch (error) {
      Logger.error('Failed to cache bridge config', error)
    }
  }

  /**
   * Get bridge config from MMKV if valid, null if expired or missing
   */
  getConfig(isDeveloperMode: boolean): BridgeConfig | null {
    try {
      const storageKey = this.getStorageKey(isDeveloperMode)
      const cached = queryStorage.getString(storageKey)
      if (!cached) {
        return null
      }

      const cacheEntry = JSON.parse(cached)
      const isExpired =
        Date.now() - cacheEntry.timestamp > BridgeConfigCache.CACHE_DURATION

      if (isExpired) {
        Logger.info('[Bridge Config] Cache expired, will fetch fresh')
        queryStorage.delete(storageKey)
        return null
      }

      Logger.info('[Bridge Config] Using cached config from MMKV')
      return cacheEntry.config
    } catch (error) {
      Logger.error('Failed to load bridge config from cache', error)
      return null
    }
  }

  /**
   * Clear bridge config cache for specific network (testnet/mainnet)
   */
  clearConfig(isDeveloperMode: boolean): void {
    queryStorage.delete(this.getStorageKey(isDeveloperMode))
  }

  /**
   * Clear bridge config cache for all networks
   */
  clearAllConfigs(): void {
    queryStorage.delete(this.getStorageKey(true)) // testnet
    queryStorage.delete(this.getStorageKey(false)) // mainnet
  }

  /**
   * Check if cache has valid config for specific network (testnet/mainnet)
   */
  hasValidConfig(isDeveloperMode: boolean): boolean {
    return this.getConfig(isDeveloperMode) !== null
  }
}

export const bridgeConfigCache = new BridgeConfigCache()
