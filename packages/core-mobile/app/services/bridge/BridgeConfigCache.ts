import { MMKV } from 'react-native-mmkv'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import Logger from 'utils/Logger'

/**
 * MMKV-based bridge config cache to replace Redux storage
 * This eliminates Redux rehydration overhead and improves app startup time
 */
class BridgeConfigCache {
  private static readonly STORAGE_KEY = 'bridge_config'
  private static readonly CACHE_DURATION = 30 * 60 * 1000 // 30 minutes

  private storage = new MMKV({ id: 'bridge_config' })

  /**
   * Store bridge config in MMKV with timestamp
   */
  setConfig(config: BridgeConfig): void {
    try {
      const cacheEntry = {
        config,
        timestamp: Date.now()
      }
      this.storage.set(
        BridgeConfigCache.STORAGE_KEY,
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
  getConfig(): BridgeConfig | null {
    try {
      const cached = this.storage.getString(BridgeConfigCache.STORAGE_KEY)
      if (!cached) {
        return null
      }

      const cacheEntry = JSON.parse(cached)
      const isExpired =
        Date.now() - cacheEntry.timestamp > BridgeConfigCache.CACHE_DURATION

      if (isExpired) {
        Logger.info('[Bridge Config] Cache expired, will fetch fresh')
        this.storage.delete(BridgeConfigCache.STORAGE_KEY)
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
   * Clear bridge config cache
   */
  clearConfig(): void {
    this.storage.delete(BridgeConfigCache.STORAGE_KEY)
  }

  /**
   * Check if cache has valid config
   */
  hasValidConfig(): boolean {
    return this.getConfig() !== null
  }
}

export const bridgeConfigCache = new BridgeConfigCache()
