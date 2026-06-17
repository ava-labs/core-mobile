/* eslint-disable @typescript-eslint/no-explicit-any */
import { Environment, ServiceType, QuoterInterface } from '@avalabs/fusion-sdk'
import {
  createTransferManager,
  calculatePriceImpactFromQuote
} from '@avalabs/fusion-sdk'
import { bigintToBig } from '@avalabs/core-utils-sdk'
import Logger from 'utils/Logger'
import FusionService from './FusionService'
import type {
  FusionConfig,
  FusionServiceFlags,
  FusionSigners,
  QuoterParams
} from './types'

// Mock the fusion-sdk
jest.mock('@avalabs/fusion-sdk', () => ({
  Environment: {
    PROD: 'PROD',
    TEST: 'TEST'
  },
  ServiceType: {
    MARKR: 'MARKR',
    AVALANCHE_EVM: 'AVALANCHE_EVM',
    AVALANCHE_CCT: 'AVALANCHE_CCT',
    LOMBARD_BTC_TO_BTCB: 'LOMBARD_BTC_TO_BTCB',
    LOMBARD_BTCB_TO_BTC: 'LOMBARD_BTCB_TO_BTC',
    WRAP_UNWRAP: 'WRAP_UNWRAP'
  },
  createTransferManager: jest.fn(),
  calculatePriceImpactFromQuote: jest.fn()
}))

jest.mock('@avalabs/core-utils-sdk', () => ({
  bigintToBig: jest.fn()
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
  const mockSvmSigner = {} as any

  const mockSigners: FusionSigners = {
    evm: mockEvmSigner,
    btc: mockBtcSigner,
    svm: mockSvmSigner
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
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
        'Fusion service initialized successfully',
        {
          environment: Environment.PROD,
          enabledServices: [ServiceType.MARKR]
        }
      )
    })

    it('should initialize with multiple services enabled', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
      expect(call.serviceInitializers).toHaveLength(4)
      expect(call.serviceInitializers).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: ServiceType.MARKR }),
          expect.objectContaining({ type: ServiceType.AVALANCHE_EVM }),
          expect.objectContaining({ type: ServiceType.LOMBARD_BTC_TO_BTCB }),
          expect.objectContaining({ type: ServiceType.WRAP_UNWRAP })
        ])
      )
    })

    it('should still initialize with only WRAP_UNWRAP when no other services are enabled', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

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

      // WRAP_UNWRAP is always included, so initialization still happens
      expect(createTransferManager).toHaveBeenCalled()
      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toHaveLength(1)
      expect(call.serviceInitializers[0]).toMatchObject({
        type: ServiceType.WRAP_UNWRAP,
        evmSigner: mockEvmSigner
      })
    })

    it('should initialize in TEST environment', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
        `Failed to initialize Fusion service: ${error.message}`,
        {
          error,
          environment: config.environment,
          enabledServices: config.enabledServices
        }
      )
    })
  })

  describe('initWithFeatureFlags', () => {
    it('should enable MARKR service when feature flag is true', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FusionServiceFlags> = {
        'fusion-markr': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FusionServiceFlags,
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
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FusionServiceFlags> = {
        'fusion-markr': true,
        'fusion-avalanche-evm': true,
        'fusion-lombard-btc-to-btcb': true,
        'fusion-lombard-btcb-to-btc': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FusionServiceFlags,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toHaveLength(5)
    })

    it('should only include WRAP_UNWRAP when all feature flags are false', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FusionServiceFlags> = {
        'fusion-markr': false,
        'fusion-avalanche-evm': false
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FusionServiceFlags,
        signers: mockSigners
      })

      // WRAP_UNWRAP is always included, so initialization still happens
      expect(createTransferManager).toHaveBeenCalled()
      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      expect(call.serviceInitializers).toHaveLength(1)
      expect(call.serviceInitializers[0]).toMatchObject({
        type: ServiceType.WRAP_UNWRAP
      })
    })

    it('should pass disableCrossChainSwaps=true to MARKR initializer when flag is set', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FusionServiceFlags> = {
        'fusion-markr': true,
        'fusion-disable-cross-chain-swaps': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FusionServiceFlags,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const markrInitializer = call.serviceInitializers.find(
        (s: { type: string }) => s.type === ServiceType.MARKR
      )
      expect(markrInitializer).toMatchObject({ disableCrossChainSwaps: true })
    })

    it('should pass disableCrossChainSwaps=false to MARKR initializer by default', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const featureFlags: Partial<FusionServiceFlags> = {
        'fusion-markr': true
      }

      await FusionService.initWithFeatureFlags({
        bitcoinProvider: mockBitcoinProvider,
        fetch: mockFetch,
        environment: Environment.PROD,
        featureFlags: featureFlags as FusionServiceFlags,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const markrInitializer = call.serviceInitializers.find(
        (s: { type: string }) => s.type === ServiceType.MARKR
      )
      expect(markrInitializer).toMatchObject({ disableCrossChainSwaps: false })
    })

    describe('AVALANCHE_CCT', () => {
      const mockCctDependencies = {
        avalancheSendTx: jest.fn(),
        getCoreEthAddress: jest.fn(),
        getAtomicUtxos: jest.fn(),
        getUtxos: jest.fn(),
        getWalletAddressesForChainAlias: jest.fn(),
        getWalletChangeAddressForChainAlias: jest.fn()
      }

      const mockManagerFactory = () => ({
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      })

      it('enables AVALANCHE_CCT when the fusion-avalanche-cct flag is on', async () => {
        ;(createTransferManager as jest.Mock).mockResolvedValue(
          mockManagerFactory()
        )

        const featureFlags: Partial<FusionServiceFlags> = {
          'fusion-avalanche-cct': true
        }

        await FusionService.initWithFeatureFlags({
          bitcoinProvider: mockBitcoinProvider,
          fetch: mockFetch,
          environment: Environment.PROD,
          featureFlags: featureFlags as FusionServiceFlags,
          signers: mockSigners,
          cctDependencies: mockCctDependencies
        })

        const call = (createTransferManager as jest.Mock).mock.calls[0][0]
        expect(call.serviceInitializers).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: ServiceType.AVALANCHE_CCT })
          ])
        )
      })

      it('throws cctDependenciesMissing when the flag is on but no cctDependencies are provided', async () => {
        ;(createTransferManager as jest.Mock).mockResolvedValue(
          mockManagerFactory()
        )

        const featureFlags: Partial<FusionServiceFlags> = {
          'fusion-avalanche-cct': true
        }

        // No cctDependencies provided — should throw before reaching the SDK.
        await expect(
          FusionService.initWithFeatureFlags({
            bitcoinProvider: mockBitcoinProvider,
            fetch: mockFetch,
            environment: Environment.PROD,
            featureFlags: featureFlags as FusionServiceFlags,
            signers: mockSigners
          })
        ).rejects.toThrow(/cctDependencies not provided/)
        expect(createTransferManager).not.toHaveBeenCalled()
      })

      it('produces an initializer carrying the six SDK callbacks when cctDependencies are provided', async () => {
        ;(createTransferManager as jest.Mock).mockResolvedValue(
          mockManagerFactory()
        )

        const featureFlags: Partial<FusionServiceFlags> = {
          'fusion-avalanche-cct': true
        }

        await FusionService.initWithFeatureFlags({
          bitcoinProvider: mockBitcoinProvider,
          fetch: mockFetch,
          environment: Environment.PROD,
          featureFlags: featureFlags as FusionServiceFlags,
          signers: mockSigners,
          cctDependencies: mockCctDependencies
        })

        const call = (createTransferManager as jest.Mock).mock.calls[0][0]
        const cctInitializer = call.serviceInitializers.find(
          (s: { type: string }) => s.type === ServiceType.AVALANCHE_CCT
        )
        expect(cctInitializer).toMatchObject({
          type: ServiceType.AVALANCHE_CCT,
          avalancheSendTx: mockCctDependencies.avalancheSendTx,
          getCoreEthAddress: mockCctDependencies.getCoreEthAddress,
          getAtomicUtxos: mockCctDependencies.getAtomicUtxos,
          getUtxos: mockCctDependencies.getUtxos,
          getWalletAddressesForChainAlias:
            mockCctDependencies.getWalletAddressesForChainAlias,
          getWalletChangeAddressForChainAlias:
            mockCctDependencies.getWalletChangeAddressForChainAlias
        })
      })

      it('does not register AVALANCHE_CCT when the flag is off', async () => {
        ;(createTransferManager as jest.Mock).mockResolvedValue(
          mockManagerFactory()
        )

        const featureFlags: Partial<FusionServiceFlags> = {
          'fusion-markr': true,
          'fusion-avalanche-cct': false
        }

        await FusionService.initWithFeatureFlags({
          bitcoinProvider: mockBitcoinProvider,
          fetch: mockFetch,
          environment: Environment.PROD,
          featureFlags: featureFlags as FusionServiceFlags,
          signers: mockSigners,
          cctDependencies: mockCctDependencies
        })

        const call = (createTransferManager as jest.Mock).mock.calls[0][0]
        const cctInitializer = call.serviceInitializers.find(
          (s: { type: string }) => s.type === ServiceType.AVALANCHE_CCT
        )
        expect(cctInitializer).toBeUndefined()
      })
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

      expect(result).toEqual(mockChainsMap)
      expect(Logger.info).toHaveBeenCalledWith(
        'Fusion Service: 2 source chains with destinations'
      )
    })

    it('should return Map with each source chain having destination Sets', async () => {
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

      // Verify it's a Map
      expect(result).toBeInstanceOf(Map)
      expect(result.size).toBe(2)

      // Verify first source chain (Avalanche) has destination Sets
      const avalancheDestinations = result.get('eip155:43114')
      expect(avalancheDestinations).toBeInstanceOf(Set)
      expect(avalancheDestinations?.size).toBe(2)
      expect(avalancheDestinations?.has('eip155:1')).toBe(true)
      expect(avalancheDestinations?.has('eip155:56')).toBe(true)

      // Verify second source chain (Ethereum) has destination Sets
      const ethereumDestinations = result.get('eip155:1')
      expect(ethereumDestinations).toBeInstanceOf(Set)
      expect(ethereumDestinations?.size).toBe(1)
      expect(ethereumDestinations?.has('eip155:43114')).toBe(true)
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
        'Failed to fetch supported chains map',
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

  describe('transferAsset', () => {
    it('should execute transfer successfully', async () => {
      const mockQuote = {
        id: 'quote-123',
        aggregator: { name: 'Markr', id: 'markr' },
        serviceType: ServiceType.MARKR
      } as any

      const mockTransfer = {
        id: 'transfer-456',
        status: 'pending',
        quote: mockQuote
      } as any

      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn().mockResolvedValue(mockTransfer),
        estimateNativeFee: jest.fn()
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

      const result = await FusionService.transferAsset(mockQuote, {
        estimateGasMarginBps: 2000
      })

      expect(result).toBe(mockTransfer)
      expect(mockTransferManager.transferAsset).toHaveBeenCalledWith({
        quote: mockQuote,
        gasSettings: { estimateGasMarginBps: 2000 }
      })
      expect(Logger.info).toHaveBeenCalledWith(
        'Executing transfer with quote:',
        {
          aggregator: 'Markr',
          serviceType: ServiceType.MARKR
        }
      )
      expect(Logger.info).toHaveBeenCalledWith('Transfer executed:', {
        transferId: 'transfer-456',
        status: 'pending'
      })
    })

    it('should throw error when service is not initialized', async () => {
      const mockQuote = {
        id: 'quote-123',
        aggregator: { name: 'Markr', id: 'markr' },
        serviceType: ServiceType.MARKR
      } as any

      await expect(
        FusionService.transferAsset(mockQuote, { estimateGasMarginBps: 2000 })
      ).rejects.toThrow('Fusion service is not initialized')
    })

    it('should log and throw error when transferAsset fails', async () => {
      const mockQuote = {
        id: 'quote-123',
        aggregator: { name: 'Markr', id: 'markr' },
        serviceType: ServiceType.MARKR
      } as any

      const error = new Error('Transfer failed')
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn().mockRejectedValue(error),
        estimateNativeFee: jest.fn()
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

      await expect(
        FusionService.transferAsset(mockQuote, { estimateGasMarginBps: 2000 })
      ).rejects.toThrow('Transfer failed')

      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to execute transfer',
        error
      )
    })
  })

  describe('cleanup', () => {
    it('should cleanup and reset the service', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
    })

    it('should configure Lombard services with BTC signer', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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

    it('should always include WRAP_UNWRAP initializer regardless of enabledServices', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      // Test with no services
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

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const wrapUnwrapInit = call.serviceInitializers.find(
        (init: any) => init.type === ServiceType.WRAP_UNWRAP
      )

      expect(wrapUnwrapInit).toBeDefined()
    })

    it('should configure WRAP_UNWRAP with correct EVM signer', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
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
      const wrapUnwrapInit = call.serviceInitializers.find(
        (init: any) => init.type === ServiceType.WRAP_UNWRAP
      )

      expect(wrapUnwrapInit).toMatchObject({
        type: ServiceType.WRAP_UNWRAP,
        evmSigner: mockEvmSigner
      })
    })

    it('should append WRAP_UNWRAP as the last initializer', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn()
      }
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      const config: FusionConfig = {
        environment: Environment.PROD,
        enabledServices: [ServiceType.MARKR, ServiceType.AVALANCHE_EVM],
        fetch: mockFetch
      }

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config,
        signers: mockSigners
      })

      const call = (createTransferManager as jest.Mock).mock.calls[0][0]
      const last = call.serviceInitializers[call.serviceInitializers.length - 1]

      expect(last.type).toBe(ServiceType.WRAP_UNWRAP)
    })
  })

  describe('trackTransfer', () => {
    it('should call SDK trackTransfer with the correct transfer and a wrapped listener', async () => {
      const resolvedTransfer = { id: 'transfer-1', status: 'completed' } as any
      const mockTrackTransfer = jest.fn().mockReturnValue({
        cancel: jest.fn(),
        result: Promise.resolve(resolvedTransfer)
      })
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: mockTrackTransfer
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

      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      const updateListener = jest.fn()

      FusionService.trackTransfer(transfer, updateListener)

      // SDK receives the correct transfer and a wrapped listener (not the original)
      expect(mockTrackTransfer).toHaveBeenCalledWith({
        transfer,
        updateListener: expect.any(Function)
      })

      // Calling the wrapped listener delegates to updateListener
      const wrappedListener = mockTrackTransfer.mock.calls[0][0].updateListener
      const update = { id: 'transfer-1', status: 'source-pending' } as any
      wrappedListener(update)
      expect(updateListener).toHaveBeenCalledWith(update)
    })

    it('should call updateListener when the SDK calls the wrapped listener with a status update', async () => {
      const completedTransfer = {
        id: 'transfer-1',
        status: 'completed'
      } as any
      const mockTrackTransfer = jest
        .fn()
        .mockImplementation(({ updateListener: wrappedListener }) => {
          // Simulate the SDK calling wrappedListener with a status update
          wrappedListener(completedTransfer)
          return {
            cancel: jest.fn(),
            result: Promise.resolve(completedTransfer)
          }
        })
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: mockTrackTransfer
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

      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      const updateListener = jest.fn()

      FusionService.trackTransfer(transfer, updateListener)

      // Flush microtasks so any promise continuations (e.g. result.then/catch) run
      await Promise.resolve()

      expect(updateListener).toHaveBeenCalledWith(completedTransfer)
      // Exactly once: the SDK's updateListener callback — not again when result resolves
      expect(updateListener).toHaveBeenCalledTimes(1)
    })

    it('should log error when result rejects', async () => {
      const trackError = new Error('tracking failed')
      const mockTrackTransfer = jest.fn().mockReturnValue({
        cancel: jest.fn(),
        result: Promise.reject(trackError)
      })
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: mockTrackTransfer
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

      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      const updateListener = jest.fn()

      FusionService.trackTransfer(transfer, updateListener)

      // Wait for the promise to reject
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(Logger.error).toHaveBeenCalledWith(
        '[FusionService] trackTransfer error',
        trackError
      )
      expect(updateListener).not.toHaveBeenCalled()
    })

    const makeTrackTransferManager = (concludedStatus: string) => {
      const concludedTransfer = {
        id: 'transfer-1',
        status: concludedStatus
      } as any
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: jest.fn().mockReturnValue({
          cancel: jest.fn(),
          result: Promise.resolve(concludedTransfer)
        })
      }
      return { concludedTransfer, mockTransferManager }
    }

    it('should call onCompleted when result resolves with a completed transfer', async () => {
      const { concludedTransfer, mockTransferManager } =
        makeTrackTransferManager('completed')
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config: {
          environment: Environment.PROD,
          enabledServices: [],
          fetch: mockFetch
        },
        signers: mockSigners
      })

      const onCompleted = jest.fn()
      FusionService.trackTransfer(
        { id: 'transfer-1', status: 'source-pending' } as any,
        jest.fn(),
        onCompleted
      )
      await Promise.resolve()

      expect(onCompleted).toHaveBeenCalledWith(concludedTransfer)
      expect(onCompleted).toHaveBeenCalledTimes(1)
    })

    it('should call onCompleted when result resolves with a failed transfer', async () => {
      const { concludedTransfer, mockTransferManager } =
        makeTrackTransferManager('failed')
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config: {
          environment: Environment.PROD,
          enabledServices: [],
          fetch: mockFetch
        },
        signers: mockSigners
      })

      const onCompleted = jest.fn()
      FusionService.trackTransfer(
        { id: 'transfer-1', status: 'source-pending' } as any,
        jest.fn(),
        onCompleted
      )
      await Promise.resolve()

      expect(onCompleted).toHaveBeenCalledWith(concludedTransfer)
    })

    it('should call onCompleted when result resolves with a refunded transfer', async () => {
      const { concludedTransfer, mockTransferManager } =
        makeTrackTransferManager('refunded')
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config: {
          environment: Environment.PROD,
          enabledServices: [],
          fetch: mockFetch
        },
        signers: mockSigners
      })

      const onCompleted = jest.fn()
      FusionService.trackTransfer(
        { id: 'transfer-1', status: 'source-pending' } as any,
        jest.fn(),
        onCompleted
      )
      await Promise.resolve()

      expect(onCompleted).toHaveBeenCalledWith(concludedTransfer)
    })

    it('should not call onCompleted when result resolves with an in-progress transfer', async () => {
      const { mockTransferManager } = makeTrackTransferManager('target-pending')
      ;(createTransferManager as jest.Mock).mockResolvedValue(
        mockTransferManager
      )

      await FusionService.init({
        bitcoinProvider: mockBitcoinProvider,
        config: {
          environment: Environment.PROD,
          enabledServices: [],
          fetch: mockFetch
        },
        signers: mockSigners
      })

      const onCompleted = jest.fn()
      FusionService.trackTransfer(
        { id: 'transfer-1', status: 'source-pending' } as any,
        jest.fn(),
        onCompleted
      )
      await Promise.resolve()

      expect(onCompleted).not.toHaveBeenCalled()
    })

    it('should throw error when service is not initialized', () => {
      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      const updateListener = jest.fn()

      expect(() =>
        FusionService.trackTransfer(transfer, updateListener)
      ).toThrow('Fusion service is not initialized')
    })

    it('should cancel in-flight tracking when cleanup is called', async () => {
      const mockCancel = jest.fn()
      const mockTrackTransfer = jest.fn().mockReturnValue({
        cancel: mockCancel,
        result: new Promise(() => {
          // do nothing
        }) // never resolves (in-flight)
      })
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: mockTrackTransfer
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

      const transfer = { id: 'transfer-1', status: 'source-pending' } as any
      FusionService.trackTransfer(transfer, jest.fn())

      expect(mockCancel).not.toHaveBeenCalled()

      FusionService.cleanup()

      expect(mockCancel).toHaveBeenCalled()
    })
  })

  describe('estimateNativeFee', () => {
    it('should delegate to transferManager.estimateNativeFee', async () => {
      const mockEstimate = { totalUpfrontFee: 1000000n } as any
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn().mockResolvedValue(mockEstimate),
        trackTransfer: jest.fn()
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

      const mockQuote = { id: 'quote-1' } as any
      const options = { feeUnitsMarginBps: 2000 }

      const result = await FusionService.estimateNativeFee(mockQuote, options)

      expect(result).toBe(mockEstimate)
      expect(mockTransferManager.estimateNativeFee).toHaveBeenCalledWith(
        mockQuote,
        options
      )
    })

    it('should call estimateNativeFee without options', async () => {
      const mockEstimate = { totalUpfrontFee: 500000n } as any
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn().mockResolvedValue(mockEstimate),
        trackTransfer: jest.fn()
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

      const mockQuote = { id: 'quote-1' } as any

      const result = await FusionService.estimateNativeFee(mockQuote)

      expect(result).toBe(mockEstimate)
      expect(mockTransferManager.estimateNativeFee).toHaveBeenCalledWith(
        mockQuote,
        undefined
      )
    })

    it('should throw when service is not initialized', async () => {
      const mockQuote = { id: 'quote-1' } as any

      await expect(FusionService.estimateNativeFee(mockQuote)).rejects.toThrow(
        'Fusion service is not initialized'
      )
    })
  })

  describe('getMinimumTransferAmount', () => {
    it('should delegate to transferManager.getMinimumTransferAmount', async () => {
      const mockResult = { [ServiceType.MARKR]: 1000000n }
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: jest.fn(),
        getMinimumTransferAmount: jest.fn().mockResolvedValue(mockResult)
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

      const props = {
        sourceAsset: {} as any,
        sourceChainId: 'eip155:43114' as any,
        targetAsset: {} as any,
        targetChainId: 'eip155:1' as any
      }

      const result = await FusionService.getMinimumTransferAmount(props)

      expect(result).toBe(mockResult)
      expect(mockTransferManager.getMinimumTransferAmount).toHaveBeenCalledWith(
        props
      )
    })

    it('should return null when no service supports the pair', async () => {
      const mockTransferManager = {
        getQuoter: jest.fn(),
        getSupportedChains: jest.fn(),
        transferAsset: jest.fn(),
        estimateNativeFee: jest.fn(),
        trackTransfer: jest.fn(),
        getMinimumTransferAmount: jest.fn().mockResolvedValue(null)
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

      const props = {
        sourceAsset: {} as any,
        sourceChainId: 'eip155:43114' as any,
        targetAsset: {} as any,
        targetChainId: 'eip155:1' as any
      }

      const result = await FusionService.getMinimumTransferAmount(props)

      expect(result).toBeNull()
    })

    it('should throw when service is not initialized', async () => {
      const props = {
        sourceAsset: {} as any,
        sourceChainId: 'eip155:43114' as any,
        targetAsset: {} as any,
        targetChainId: 'eip155:1' as any
      }

      await expect(
        FusionService.getMinimumTransferAmount(props)
      ).rejects.toThrow('Fusion service is not initialized')
    })
  })

  describe('calculatePriceImpactFromQuote', () => {
    it('should return bps value from the SDK', async () => {
      ;(calculatePriceImpactFromQuote as jest.Mock).mockResolvedValue(150)

      const mockQuote = { id: 'quote-1' } as any
      const result = await FusionService.calculatePriceImpactFromQuote(
        mockQuote,
        1.5,
        2.0
      )

      expect(result).toBe(150)
      expect(calculatePriceImpactFromQuote).toHaveBeenCalledWith(
        mockQuote,
        expect.any(Function)
      )
    })

    it('should return null when SDK cannot determine price impact', async () => {
      ;(calculatePriceImpactFromQuote as jest.Mock).mockResolvedValue(null)

      const mockQuote = { id: 'quote-1' } as any
      const result = await FusionService.calculatePriceImpactFromQuote(
        mockQuote,
        1.5,
        2.0
      )

      expect(result).toBeNull()
    })

    it('should pass correct USD values to the SDK pricing callback', async () => {
      let capturedCallback: (
        input: any,
        output: any
      ) => Promise<[number, number]>
      ;(calculatePriceImpactFromQuote as jest.Mock).mockImplementation(
        (_quote: any, callback: any) => {
          capturedCallback = callback
          return Promise.resolve(200)
        }
      )
      ;(bigintToBig as jest.Mock)
        .mockReturnValueOnce({ toNumber: () => 5 })
        .mockReturnValueOnce({ toNumber: () => 3 })

      const mockQuote = { id: 'quote-1' } as any
      await FusionService.calculatePriceImpactFromQuote(mockQuote, 2.0, 4.0)

      const mockInput = { amount: 5000000n, asset: { decimals: 6 } }
      const mockOutput = { amount: 3000000n, asset: { decimals: 6 } }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const [inputUsd, outputUsd] = await capturedCallback!(
        mockInput,
        mockOutput
      )

      expect(bigintToBig).toHaveBeenCalledWith(
        mockInput.amount,
        mockInput.asset.decimals
      )
      expect(bigintToBig).toHaveBeenCalledWith(
        mockOutput.amount,
        mockOutput.asset.decimals
      )
      expect(inputUsd).toBe(10) // 5 * 2.0
      expect(outputUsd).toBe(12) // 3 * 4.0
    })
  })
})
