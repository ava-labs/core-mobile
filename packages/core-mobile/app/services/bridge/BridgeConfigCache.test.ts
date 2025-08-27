import { jest } from '@jest/globals'
import { BridgeConfig } from '@avalabs/core-bridge-sdk'
import { queryStorage } from 'utils/mmkv/storages'
import Logger from 'utils/Logger'
import { bridgeConfigCache } from './BridgeConfigCache'

// Mock dependencies
jest.mock('utils/mmkv/storages', () => ({
  queryStorage: {
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn()
  }
}))

jest.mock('utils/Logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}))

const mockQueryStorage = queryStorage as jest.Mocked<typeof queryStorage>
const mockLogger = Logger as jest.Mocked<typeof Logger>

describe('BridgeConfigCache', () => {
  const mockBridgeConfig = {
    config: {
      critical: { bridgeEnabled: true },
      assets: { ethereum: [], avalanche: [] }
    },
    assets: { ethereum: [], avalanche: [] }
  } as unknown as BridgeConfig

  const realDateNow = Date.now

  beforeEach(() => {
    jest.clearAllMocks()
    Date.now = jest.fn(() => 1000000) // Fixed timestamp for predictable tests
  })

  afterEach(() => {
    Date.now = realDateNow
  })

  describe('setConfig', () => {
    it('should store config for mainnet with correct storage key', () => {
      bridgeConfigCache.setConfig(mockBridgeConfig, false)

      expect(mockQueryStorage.set).toHaveBeenCalledWith(
        'bridge_config_mainnet',
        JSON.stringify({
          config: mockBridgeConfig,
          timestamp: 1000000
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[Bridge Config] Cached config in MMKV'
      )
    })

    it('should store config for testnet with correct storage key', () => {
      bridgeConfigCache.setConfig(mockBridgeConfig, true)

      expect(mockQueryStorage.set).toHaveBeenCalledWith(
        'bridge_config_testnet',
        JSON.stringify({
          config: mockBridgeConfig,
          timestamp: 1000000
        })
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[Bridge Config] Cached config in MMKV'
      )
    })

    it('should handle storage errors gracefully', () => {
      const error = new Error('Storage error')
      mockQueryStorage.set.mockImplementation(() => {
        throw error
      })

      bridgeConfigCache.setConfig(mockBridgeConfig, false)

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to cache bridge config',
        error
      )
    })
  })

  describe('getConfig', () => {
    it('should return null when no cached data exists', () => {
      mockQueryStorage.getString.mockReturnValue(undefined)

      const result = bridgeConfigCache.getConfig(false)

      expect(result).toBeNull()
      expect(mockQueryStorage.getString).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
    })

    it('should return cached config when data is valid and not expired', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - 10 * 60 * 1000 // 10 minutes ago (within 30min cache duration)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.getConfig(false)

      expect(result).toEqual(mockBridgeConfig)
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[Bridge Config] Using cached config from MMKV'
      )
    })

    it('should return null and delete expired cache', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - 40 * 60 * 1000 // 40 minutes ago (expired)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.getConfig(false)

      expect(result).toBeNull()
      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
      expect(mockLogger.info).toHaveBeenCalledWith(
        '[Bridge Config] Cache expired, will fetch fresh'
      )
    })

    it('should use correct storage key for testnet', () => {
      mockQueryStorage.getString.mockReturnValue(undefined)

      bridgeConfigCache.getConfig(true)

      expect(mockQueryStorage.getString).toHaveBeenCalledWith(
        'bridge_config_testnet'
      )
    })

    it('should handle JSON parsing errors gracefully', () => {
      mockQueryStorage.getString.mockReturnValue('invalid json')

      const result = bridgeConfigCache.getConfig(false)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load bridge config from cache',
        expect.any(Error)
      )
    })

    it('should handle storage errors gracefully', () => {
      const error = new Error('Storage error')
      mockQueryStorage.getString.mockImplementation(() => {
        throw error
      })

      const result = bridgeConfigCache.getConfig(false)

      expect(result).toBeNull()
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to load bridge config from cache',
        error
      )
    })
  })

  describe('clearConfig', () => {
    it('should clear mainnet config', () => {
      bridgeConfigCache.clearConfig(false)

      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
    })

    it('should clear testnet config', () => {
      bridgeConfigCache.clearConfig(true)

      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_testnet'
      )
    })
  })

  describe('clearAllConfigs', () => {
    it('should clear both testnet and mainnet configs', () => {
      bridgeConfigCache.clearAllConfigs()

      expect(mockQueryStorage.delete).toHaveBeenCalledTimes(2)
      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_testnet'
      )
      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
    })
  })

  describe('hasValidConfig', () => {
    it('should return true when valid config exists', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - 10 * 60 * 1000 // 10 minutes ago (valid)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.hasValidConfig(false)

      expect(result).toBe(true)
    })

    it('should return false when no config exists', () => {
      mockQueryStorage.getString.mockReturnValue(undefined)

      const result = bridgeConfigCache.hasValidConfig(false)

      expect(result).toBe(false)
    })

    it('should return false when config is expired', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - 40 * 60 * 1000 // 40 minutes ago (expired)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.hasValidConfig(false)

      expect(result).toBe(false)
    })
  })

  describe('network separation', () => {
    it('should maintain separate caches for testnet and mainnet', () => {
      const mainnetConfig = {
        ...mockBridgeConfig,
        environment: 'mainnet'
      } as BridgeConfig
      const testnetConfig = {
        ...mockBridgeConfig,
        environment: 'testnet'
      } as BridgeConfig

      // Store different configs for different networks
      bridgeConfigCache.setConfig(mainnetConfig, false)
      bridgeConfigCache.setConfig(testnetConfig, true)

      expect(mockQueryStorage.set).toHaveBeenCalledTimes(2)
      expect(mockQueryStorage.set).toHaveBeenNthCalledWith(
        1,
        'bridge_config_mainnet',
        expect.stringContaining('"environment":"mainnet"')
      )
      expect(mockQueryStorage.set).toHaveBeenNthCalledWith(
        2,
        'bridge_config_testnet',
        expect.stringContaining('"environment":"testnet"')
      )
    })

    it('should retrieve correct config for each network', () => {
      const mainnetEntry = {
        config: { ...mockBridgeConfig, environment: 'mainnet' },
        timestamp: 1000000 - 10 * 60 * 1000
      }
      const testnetEntry = {
        config: { ...mockBridgeConfig, environment: 'testnet' },
        timestamp: 1000000 - 10 * 60 * 1000
      }

      mockQueryStorage.getString
        .mockReturnValueOnce(JSON.stringify(mainnetEntry)) // mainnet call
        .mockReturnValueOnce(JSON.stringify(testnetEntry)) // testnet call

      const mainnetResult = bridgeConfigCache.getConfig(false)
      const testnetResult = bridgeConfigCache.getConfig(true)

      expect(mainnetResult).toEqual(mainnetEntry.config)
      expect(testnetResult).toEqual(testnetEntry.config)
      expect(mockQueryStorage.getString).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
      expect(mockQueryStorage.getString).toHaveBeenCalledWith(
        'bridge_config_testnet'
      )
    })
  })

  describe('cache expiration', () => {
    it('should respect 30-minute cache duration', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - (30 * 60 * 1000 + 1) // 30 minutes and 1ms ago (expired)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.getConfig(false)

      // Should be expired (> 30 minutes)
      expect(result).toBeNull()
      expect(mockQueryStorage.delete).toHaveBeenCalledWith(
        'bridge_config_mainnet'
      )
    })

    it('should allow cache at exactly 30 minutes', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - 30 * 60 * 1000 // Exactly 30 minutes ago (still valid)
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.getConfig(false)

      // Should still be valid (not > 30 minutes)
      expect(result).toEqual(mockBridgeConfig)
      expect(mockQueryStorage.delete).not.toHaveBeenCalled()
    })

    it('should allow cache just under 30 minutes', () => {
      const cacheEntry = {
        config: mockBridgeConfig,
        timestamp: 1000000 - (29 * 60 * 1000 + 59 * 1000) // 29 minutes 59 seconds ago
      }
      mockQueryStorage.getString.mockReturnValue(JSON.stringify(cacheEntry))

      const result = bridgeConfigCache.getConfig(false)

      // Should still be valid
      expect(result).toEqual(mockBridgeConfig)
      expect(mockQueryStorage.delete).not.toHaveBeenCalled()
    })
  })
})
