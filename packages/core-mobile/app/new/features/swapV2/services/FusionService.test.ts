/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Environment,
  ServiceType,
  QuoterInterface
} from '@avalabs/unified-asset-transfer'
import type { FeatureFlags } from 'services/posthog/types'
import { createTransferManager } from '@avalabs/unified-asset-transfer'
import Logger from 'utils/Logger'
import FusionService from './FusionService'
import type { FusionConfig, FusionSigners, QuoterParams } from './types'

// Mock the unified-asset-transfer SDK
jest.mock('@avalabs/unified-asset-transfer', () => ({
  Environment: {
    PROD: 'PROD',
    TEST: 'TEST'
  },
  ServiceType: {
    MARKR: 'MARKR',
    AVALANCHE_EVM: 'AVALANCHE_EVM',
    LOMBARD_BTC_TO_BTCB: 'LOMBARD_BTC_TO_BTCB',
    LOMBARD_BTCB_TO_BTC: 'LOMBARD_BTCB_TO_BTC'
  },
  createTransferManager: jest.fn()
}))

// Mock Logger
jest.mock('utils/Logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}))

describe('FusionService', () => {
  const mockBitcoinProvider = {} as any
  const mockFetch = jest.fn() as any
  const mockEvmSigner = {} as any
  const mockBtcSigner = {} as any

  const mockSigners: FusionSigners = {
    evm: mockEvmSigner,
    btc: mockBtcSigner
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset the service state
    FusionService.cleanup()
  })

  describe('Initialization', () => {
    it('should initialize with MARKR service enabled', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      expect(createTransferManager).toHaveBeenCalledWith({
        environment: Environment.PROD,
        fetch: mockFetch,
        serviceInitializers: expect.arrayContaining([
          expect.objectContaining({
            type: ServiceType.MARKR,
            evmSigner: mockEvmSigner
          })
        ])
      })
      expect(Logger.info).toHaveBeenCalledWith(
        'Fusion service initialized successfully'
      )
    })

    it('should initialize with multiple services enabled', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [
          ServiceType.MARKR,
          ServiceType.AVALANCHE_EVM,
          ServiceType.LOMBARD_BTC_TO_BTCB
        ],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toHaveLength(3)
      expect(call.serviceInitializers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: ServiceType.MARKR }),
          expect.objectContaining({ type: ServiceType.AVALANCHE_EVM }),
          expect.objectContaining({ type: ServiceType.LOMBARD_BTC_TO_BTCB })
        ])
      )
    })

    it('should skip initialization when no services are enabled', async () => {
      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      expect(createTransferManager).not.toHaveBeenCalled()
      expect(Logger.warn).toHaveBeenCalledWith(
        'No Fusion services enabled. Skipping initialization.'
      )
    })

    it('should initialize in TEST environment', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.TEST,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      expect(createTransferManager).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: Environment.TEST
        })
      )
    })

    it('should throw and log error when initialization fails', async () => {
      const error = new Error('SDK initialization failed')
      ;(createTransferManager as jest.Mock).mockRejectedValue(error)

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await expect(
        FusionService.init({
          bitcoinProvider: mockBitcoinProvider,
          config,
          signers: mockSigners
        })
      ).rejects.toThrow('SDK initialization failed')

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to initialize Fusion service',
        error
      )
    })
  })

  describe('initWithFeatureFlags', () => {
    it('should enable MARKR service when feature flag is true', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FeatureFlags> = {
        'fusion-markr': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FeatureFlags,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: ServiceType.MARKR })
        ])
      )
    })

    it('should enable multiple services based on feature flags', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FeatureFlags> = {
        'fusion-markr': true,
        'fusion-avalanche-evm': true,
        'fusion-lombard-btc-to-btcb': true,
        'fusion-lombard-btcb-to-btc': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FeatureFlags,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toHaveLength(4)
    })

    it('should not enable services when feature flags are false', async () => {
      const featureFlags: Partial<FeatureFlags> = {
        'fusion-markr': false,
        'fusion-avalanche-evm': false
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FeatureFlags,
        signers: mockSigners
      })

      expect(createTransferManager).not.toHaveBeenCalled()
    })
  })

  describe('getSupportedChains', () => {
    it('should return supported chains from TransferManager', async () => {
      const mockChainsMap = new Map([
        ['eip155:43114', new Set(['eip155:1', 'eip155:56'])],
        ['eip155:1', new Set(['eip155:43114'])]
      ])

      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn().mockResolvedValue(mockChainsMap)
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const result = await FusionService.getSupportedChains()

      expect(result).toEqual(['eip155:43114', 'eip155:1'])
      expect(Logger.info).toHaveBeenCalledWith(
        'Fusion Service supports 2 source chains'
      )
    })

    it('should throw error when service is not initialized', async () => {
      await expect(FusionService.getSupportedChains()).rejects.toThrow(
        'Fusion service is not initialized'
      )
    })

    it('should log and throw error when getSupportedChains fails', async () => {
      const error = new Error('Failed to fetch chains')
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn().mockRejectedValue(error)
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      await expect(FusionService.getSupportedChains()).rejects.toThrow(
        'Failed to fetch chains'
      )

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to fetch supported chains from Fusion Service',
        error
      )
    })
  })

  describe('getQuoter', () => {
    it('should create and return a Quoter instance', async () => {
      const mockQuoter: QuoterInterface = {
        subscribe: jest.fn()
      } as any

      const mockTransferManager = {
        getQuoter: jest.fn().mockReturnValue(mockQuoter),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const params: QuoterParams = {
        fromAddress: '0x123',
        toAddress: '0x456',
        sourceChain: {} as any,
        targetChain: {} as any,
        sourceAsset: {} as any,
        targetAsset: {} as any,
        amount: 1000000n
      }

      const result = FusionService.getQuoter(params)

      expect(result).toBe(mockQuoter)
      expect(mockTransferManager.getQuoter).toHaveBeenCalledWith(params)
      expect(Logger.info).toHaveBeenCalledWith(
        'Quoter instance created successfully'
      )
    })

    it('should throw error when service is not initialized', () => {
      const params: QuoterParams = {
        fromAddress: '0x123',
        toAddress: '0x456',
        sourceChain: {} as any,
        targetChain: {} as any,
        sourceAsset: {} as any,
        targetAsset: {} as any,
        amount: 1000000n
      }

      expect(() => FusionService.getQuoter(params)).toThrow(
        'Fusion service is not initialized'
      )
    })

    it('should log and throw error when getQuoter fails', async () => {
      const error = new Error('Failed to create quoter')
      const mockTransferManager = {
        getQuoter: jest.fn().mockImplementation(() => {
          throw error
        }),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const params: QuoterParams = {
        fromAddress: '0x123',
        toAddress: '0x456',
        sourceChain: {} as any,
        targetChain: {} as any,
        sourceAsset: {} as any,
        targetAsset: {} as any,
        amount: 1000000n
      }

      expect(() => FusionService.getQuoter(params)).toThrow(
        'Failed to create quoter'
      )

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to create Quoter instance',
        error
      )
    })
  })

  describe('cleanup', () => {
    it('should cleanup and reset the service', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      // Service should be initialized
      const params: QuoterParams = {
        fromAddress: '0x123',
        toAddress: '0x456',
        sourceChain: {} as any,
        targetChain: {} as any,
        sourceAsset: {} as any,
        targetAsset: {} as any,
        amount: 1000000n
      }
      expect(() => FusionService.getQuoter(params)).not.toThrow()

      // Cleanup
      FusionService.cleanup()

      expect(Logger.info).toHaveBeenCalledWith('Fusion service cleaned up')

      // Service should be uninitialized after cleanup
      expect(() => FusionService.getQuoter(params)).toThrow(
        'Fusion service is not initialized'
      )
    })

    it('should allow re-initialization after cleanup', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      // First initialization
      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      // Cleanup
      FusionService.cleanup()

      // Re-initialize
      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      // Should work after re-initialization
      const params: QuoterParams = {
        fromAddress: '0x123',
        toAddress: '0x456',
        sourceChain: {} as any,
        targetChain: {} as any,
        sourceAsset: {} as any,
        targetAsset: {} as any,
        amount: 1000000n
      }
      expect(() => FusionService.getQuoter(params)).not.toThrow()
    })
  })

  describe('Service initializer configuration', () => {
    it('should configure MARKR with correct parameters', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const markrInit = call.serviceInitializers.find(
        (init: any) => init.type === ServiceType.MARKR
      )

      expect(markrInit).toMatchObject({
        type: ServiceType.MARKR,
        evmSigner: mockEvmSigner
      })
      expect(markrInit.markrApiUrl).toBeDefined()
      expect(markrInit.markrAppId).toBeDefined()
    })

    it('should configure Lombard services with BTC signer', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.LOMBARD_BTC_TO_BTCB],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const lombardInit = call.serviceInitializers.find(
        (init: any) => init.type === ServiceType.LOMBARD_BTC_TO_BTCB
      )

      expect(lombardInit).toMatchObject({
        type: ServiceType.LOMBARD_BTC_TO_BTCB,
        evmSigner: mockEvmSigner,
        btcSigner: mockBtcSigner
      })
      expect(lombardInit.btcFunctions).toBe(mockBitcoinProvider)
    })
  })
})
