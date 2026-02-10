/* eslint-disable @typescript-eslint/no-explicit-any */
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { CoreAccountType } from '@avalabs/types'
import { TokenType } from '@avalabs/vm-module-types'
import { Account } from 'store/account/types'
import { BalanceService } from './BalanceService'

// Mock dependencies
const mockGetBalancesStream = jest.fn()
const mockLoadModuleByNetwork = jest.fn()
const mockGetSupportedChainsFromCache = jest.fn()
const mockMapBalanceResponseToLegacy = jest.fn()

jest.mock('utils/apiClient/balance/balanceApi', () => ({
  balanceApi: {
    getBalancesStream: (...args: unknown[]) => mockGetBalancesStream(...args)
  }
}))

jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    loadModuleByNetwork: (...args: unknown[]) =>
      mockLoadModuleByNetwork(...args)
  }
}))

jest.mock('hooks/balance/useSupportedChains', () => ({
  getSupportedChainsFromCache: () => mockGetSupportedChainsFromCache()
}))

jest.mock('./utils/mapBalanceResponseToLegacy', () => ({
  mapBalanceResponseToLegacy: (...args: unknown[]) =>
    mockMapBalanceResponseToLegacy(...args)
}))

// Mock buildRequestItemsForAccounts to return simple batches
jest.mock('./utils/buildRequestItemsForAccounts', () => ({
  buildRequestItemsForAccounts: ({
    networks,
    accounts: _accounts,
    xpAddressesByAccountId: _xpAddressesByAccountId,
    xpubByAccountId: _xpubByAccountId
  }: {
    networks: any[]
    accounts: any[]
    xpAddressesByAccountId: Map<string, string[]>
    xpubByAccountId: Map<string, string | undefined>
  }) => {
    // Return one batch with all networks
    return [
      networks.map((n: any) => ({
        caip2Id: `eip155:${n.chainId}`,
        addresses: ['test-address']
      }))
    ]
  }
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('services/sentry/SentryWrapper', () => ({
  __esModule: true,
  default: {
    startSpan: jest.fn((_options, callback) => callback(undefined))
  }
}))

jest.mock('utils/coingeckoInMemoryCache', () => ({
  coingeckoInMemoryCache: {}
}))

jest.mock('vmModule/utils/mapToVmNetwork', () => ({
  mapToVmNetwork: (network: any) => network
}))

jest.mock('store/account/utils', () => ({
  getAddressByNetwork: (account: any, network: any) => {
    if (network.vmName === 'EVM') return account.addressC
    if (network.vmName === 'BITCOIN') return account.addressBTC
    return account.addressC
  }
}))

jest.mock('utils/network/isAvalancheNetwork', () => ({
  isPChain: (chainId: number) => chainId === 4503599627370471,
  isXChain: (chainId: number) => chainId === 4503599627370469,
  isXPNetwork: (network: any) =>
    network.vmName === 'AVM' || network.vmName === 'PVM'
}))

// Test data - using realistic account data matching mapBalanceResponseToLegacy.test.ts
const testAccount: Account = {
  name: 'Test Account',
  id: '327ce105-2191-4157-9a9a-a97ce7fae271',
  walletId: '1234567890',
  index: 0,
  type: CoreAccountType.PRIMARY as CoreAccountType.PRIMARY,
  addressC: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressCoreEth: '0x066b2322a30d7C5838035112F3b816b46D639bBC',
  addressBTC: 'bc1qmm9qawklnfau5hhrkt33kqumggxwy7s9raxuxk',
  addressSVM: '9gQmZ7fTTgv5hVScrr9QqT6SpBs7i4cKLDdj4tuae3sW',
  addressAVM: 'X-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf',
  addressPVM: 'P-avax1aahxdv3wqxd42rxdalvp2knxs244r06wrxmvlf'
}

const testAccount2: Account = {
  name: 'Test Account 2',
  id: '8f2e4b6c-3a1d-4e5f-9c8b-7d6e5f4a3b2c',
  walletId: '1234567890',
  index: 1,
  type: CoreAccountType.PRIMARY as CoreAccountType.PRIMARY,
  addressC: '0x1234567890abcdef1234567890abcdef12345678',
  addressCoreEth: '0x1234567890abcdef1234567890abcdef12345678',
  addressBTC: 'bc1q2nd4ccnt3stch7guvvrkajcgd5lw9yksk7e5s4',
  addressSVM: '7hUdUTkJLwdcmt3pm6rC3WCiLxNXNYiRp3m34sT9Cqct',
  addressAVM: 'X-avax1bbhxdv3wqxd42rxdalvp2knxs244r06wrxmvlg',
  addressPVM: 'P-avax1bbhxdv3wqxd42rxdalvp2knxs244r06wrxmvlg'
}

const cChainNetwork = {
  chainId: 43114,
  chainName: 'Avalanche C-Chain',
  vmName: 'EVM' as NetworkVMType
}

const ethereumNetwork = {
  chainId: 1,
  chainName: 'Ethereum',
  vmName: 'EVM' as NetworkVMType
}

const btcNetwork = {
  chainId: 4503599627370475,
  chainName: 'Bitcoin',
  vmName: 'BITCOIN' as NetworkVMType
}

// Helper to create async iterator from array
async function* createAsyncIterator<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item
  }
}

describe('BalanceService', () => {
  let balanceService: BalanceService

  beforeEach(() => {
    jest.clearAllMocks()
    balanceService = new BalanceService()

    // Default mock implementations
    mockGetSupportedChainsFromCache.mockResolvedValue([])
  })

  describe('getBalancesForAccount', () => {
    it('should return balances when Balance API succeeds', async () => {
      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      const mockNormalizedBalance = {
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [{ symbol: 'AVAX', balance: 1000n }],
        dataAccurate: true,
        error: null
      }

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )
      mockMapBalanceResponseToLegacy.mockReturnValue(mockNormalizedBalance)

      const onBalanceLoaded = jest.fn()

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        onBalanceLoaded,
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockNormalizedBalance)
      expect(onBalanceLoaded).toHaveBeenCalledWith(mockNormalizedBalance)
      expect(mockLoadModuleByNetwork).not.toHaveBeenCalled() // No fallback needed
    })

    it('should fallback to VM modules when Balance API throws', async () => {
      // Balance API throws
      mockGetBalancesStream.mockImplementation(() => {
        throw new Error('Balance API is down')
      })

      // VM module succeeds
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            avax: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
              balance: '1000000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(cChainNetwork)
      expect(result).toHaveLength(1)
      expect(result[0]?.chainId).toBe(43114)
    })

    it('should fallback to VM modules for chains that failed', async () => {
      // C-Chain succeeds, Ethereum fails
      const mockCChainResponse = {
        caip2Id: 'eip155:43114',
        networkType: 'evm',
        id: testAccount.addressC
      }
      const mockEthResponse = {
        caip2Id: 'eip155:1',
        networkType: 'evm',
        id: testAccount.addressC
      }

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator([mockCChainResponse, mockEthResponse])
      )

      // C-Chain normalizes successfully, Ethereum has error
      mockMapBalanceResponseToLegacy
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 43114,
          tokens: [],
          dataAccurate: true,
          error: null
        })
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 1,
          tokens: [],
          dataAccurate: false,
          error: { message: 'Chain not supported' }
        })

      // VM module for fallback
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            eth: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
              balance: '500000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any, ethereumNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // Should have called VM module only for Ethereum (failed chain)
      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(ethereumNetwork)
      expect(result).toHaveLength(2)
    })

    it('should retry filtered out EVM chains via VM modules', async () => {
      // Simulate that Ethereum is not in supported chains
      mockGetSupportedChainsFromCache.mockResolvedValue([
        'eip155:43114' // Only C-Chain supported
      ])

      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )
      mockMapBalanceResponseToLegacy.mockReturnValue({
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [],
        dataAccurate: true,
        error: null
      })

      // VM module for Ethereum fallback
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            eth: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
              balance: '0',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any, ethereumNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // Ethereum should be retried via VM modules since it was filtered out
      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(ethereumNetwork)
    })
  })

  describe('getBalancesForAccounts', () => {
    it('should return balances for multiple accounts when Balance API succeeds', async () => {
      const mockStreamResponses = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        },
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount2.addressC
        }
      ]

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponses)
      )

      mockMapBalanceResponseToLegacy
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 43114,
          tokens: [],
          dataAccurate: true,
          error: null
        })
        .mockReturnValueOnce({
          accountId: testAccount2.id,
          chainId: 43114,
          tokens: [],
          dataAccurate: true,
          error: null
        })

      const onBalanceLoaded = jest.fn()

      const result = await balanceService.getBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [testAccount, testAccount2],
        currency: 'usd',
        onBalanceLoaded,
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']],
          [testAccount2.id, ['avax2test1', 'avax2test2']]
        ])
      })

      expect(result[testAccount.id]).toHaveLength(1)
      expect(result[testAccount2.id]).toHaveLength(1)
      expect(onBalanceLoaded).toHaveBeenCalledTimes(2)
      expect(mockLoadModuleByNetwork).not.toHaveBeenCalled() // No fallback needed
    })

    it('should fallback to VM modules when Balance API throws', async () => {
      // Balance API throws
      mockGetBalancesStream.mockImplementation(() => {
        throw new Error('Balance API is down')
      })

      // VM module succeeds
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            avax: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
              balance: '1000000000000000000',
              type: TokenType.NATIVE
            }
          },
          [testAccount2.addressC]: {
            avax: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
              balance: '2000000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const result = await balanceService.getBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [testAccount, testAccount2],
        currency: 'usd',
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']],
          [testAccount2.id, ['avax2test1', 'avax2test2']]
        ])
      })

      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(cChainNetwork)
      expect(result[testAccount.id]).toBeDefined()
      expect(result[testAccount2.id]).toBeDefined()
    })

    it('should fallback to VM modules for chains that failed', async () => {
      const mockResponses = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        },
        { caip2Id: 'eip155:1', networkType: 'evm', id: testAccount.addressC }
      ]

      mockGetBalancesStream.mockReturnValue(createAsyncIterator(mockResponses))

      // C-Chain succeeds, Ethereum fails
      mockMapBalanceResponseToLegacy
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 43114,
          tokens: [],
          dataAccurate: true,
          error: null
        })
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 1,
          tokens: [],
          dataAccurate: false,
          error: { message: 'Failed' }
        })

      // VM module for fallback
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            eth: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
              balance: '0',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      await balanceService.getBalancesForAccounts({
        networks: [cChainNetwork as any, ethereumNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      // Should have called VM module only for Ethereum (failed chain)
      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(ethereumNetwork)
    })

    it('should merge VM results replacing failed balances', async () => {
      const mockResponses = [
        { caip2Id: 'eip155:1', networkType: 'evm', id: testAccount.addressC }
      ]

      mockGetBalancesStream.mockReturnValue(createAsyncIterator(mockResponses))

      // Initial balance has error
      const failedBalance = {
        accountId: testAccount.id,
        chainId: 1,
        tokens: [],
        dataAccurate: false,
        error: { message: 'Failed' }
      }
      mockMapBalanceResponseToLegacy.mockReturnValue(failedBalance)

      // VM module returns successful balance
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            eth: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
              balance: '1000000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const result = await balanceService.getBalancesForAccounts({
        networks: [ethereumNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      // The failed balance should be replaced with VM result
      expect(result[testAccount.id]).toHaveLength(1)
      expect(result[testAccount.id]?.[0]?.dataAccurate).toBe(true)
    })

    it('should call onBalanceLoaded for VM fallback results', async () => {
      // Balance API throws
      mockGetBalancesStream.mockImplementation(() => {
        throw new Error('Balance API is down')
      })

      // VM module succeeds
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            avax: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
              balance: '1000000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const onBalanceLoaded = jest.fn()

      await balanceService.getBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        onBalanceLoaded,
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      // onBalanceLoaded should be called for the VM fallback result
      expect(onBalanceLoaded).toHaveBeenCalled()
    })
  })

  describe('getVMBalancesForAccounts', () => {
    it('should fetch balances directly from VM modules', async () => {
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            avax: {
              name: 'Avalanche',
              symbol: 'AVAX',
              decimals: 18,
              balance: '1000000000000000000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const onBalanceLoaded = jest.fn()

      const result = await balanceService.getVMBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        customTokens: {},
        onBalanceLoaded,
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(cChainNetwork)
      expect(mockModule.getBalances).toHaveBeenCalled()
      expect(result[testAccount.id]).toBeDefined()
      expect(onBalanceLoaded).toHaveBeenCalled()
    })

    it('should handle VM module errors gracefully', async () => {
      mockLoadModuleByNetwork.mockRejectedValue(new Error('Module load failed'))

      const onBalanceLoaded = jest.fn()

      const result = await balanceService.getVMBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        customTokens: {},
        onBalanceLoaded,
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      // Should return error entry for the failed network
      expect(result[testAccount.id]).toHaveLength(1)
      expect(result[testAccount.id]?.[0]?.dataAccurate).toBe(false)
      expect(result[testAccount.id]?.[0]?.error).toBeDefined()
      expect(onBalanceLoaded).toHaveBeenCalled() // Still called with error partial
    })

    it('should process multiple networks in parallel', async () => {
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            token: {
              name: 'Token',
              symbol: 'TKN',
              decimals: 18,
              balance: '1000',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const result = await balanceService.getVMBalancesForAccounts({
        networks: [cChainNetwork as any, ethereumNetwork as any],
        accounts: [testAccount],
        currency: 'usd',
        customTokens: {},
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']]
        ])
      })

      expect(mockLoadModuleByNetwork).toHaveBeenCalledTimes(2)
      expect(result[testAccount.id]).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('should handle empty networks array', async () => {
      const result = await balanceService.getBalancesForAccount({
        networks: [],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      expect(result).toEqual([])
      expect(mockGetBalancesStream).not.toHaveBeenCalled()
      expect(mockLoadModuleByNetwork).not.toHaveBeenCalled()
    })

    it('should handle empty accounts array for getBalancesForAccounts', async () => {
      const result = await balanceService.getBalancesForAccounts({
        networks: [cChainNetwork as any],
        accounts: [],
        currency: 'usd',
        xpAddressesByAccountId: new Map([
          [testAccount.id, ['avax1test1', 'avax1test2']],
          [testAccount2.id, ['avax2test1', 'avax2test2']]
        ])
      })

      expect(result).toEqual({})
    })

    it('should skip balances when mapBalanceResponseToLegacy returns null', async () => {
      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )
      mockMapBalanceResponseToLegacy.mockReturnValue(null)

      const onBalanceLoaded = jest.fn()

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        onBalanceLoaded,
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // No results because mapBalanceResponseToLegacy returned null
      expect(result).toHaveLength(0)
      expect(onBalanceLoaded).not.toHaveBeenCalled()
    })

    it('should work without onBalanceLoaded callback', async () => {
      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      const mockNormalizedBalance = {
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [],
        dataAccurate: true,
        error: null
      }

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )
      mockMapBalanceResponseToLegacy.mockReturnValue(mockNormalizedBalance)

      // No callback provided
      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(mockNormalizedBalance)
    })

    it('should handle both Balance API and VM fallback failing', async () => {
      // Balance API throws
      mockGetBalancesStream.mockImplementation(() => {
        throw new Error('Balance API is down')
      })

      // VM module also fails
      mockLoadModuleByNetwork.mockRejectedValue(new Error('VM module failed'))

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // Should return error result from VM fallback
      expect(result).toHaveLength(1)
      expect(result[0]?.dataAccurate).toBe(false)
      expect(result[0]?.error).toBeDefined()
    })

    it('should handle partial batch failures gracefully', async () => {
      // First call succeeds, simulating partial success
      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )

      mockMapBalanceResponseToLegacy.mockReturnValue({
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [],
        dataAccurate: true,
        error: null
      })

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      expect(result).toHaveLength(1)
    })

    it('should not call onBalanceLoaded for failed balances from API', async () => {
      const mockStreamResponse = [
        {
          caip2Id: 'eip155:43114',
          networkType: 'evm',
          id: testAccount.addressC
        }
      ]

      const failedBalance = {
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [],
        dataAccurate: false,
        error: { message: 'Failed' }
      }

      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator(mockStreamResponse)
      )
      mockMapBalanceResponseToLegacy.mockReturnValue(failedBalance)

      // VM module for retry
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            avax: {
              name: 'AVAX',
              symbol: 'AVAX',
              decimals: 18,
              balance: '0',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      const onBalanceLoaded = jest.fn()

      await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any],
        account: testAccount,
        currency: 'usd',
        onBalanceLoaded,
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // onBalanceLoaded should NOT be called for the initial failed balance
      // but should be called for the VM fallback result
      expect(onBalanceLoaded).toHaveBeenCalledTimes(1)
    })
  })

  describe('filterNetworksBySupportedEvm', () => {
    it('should filter out unsupported EVM networks', async () => {
      mockGetSupportedChainsFromCache.mockResolvedValue([
        'eip155:43114' // Only C-Chain supported
      ])

      // Balance API returns only for supported chain
      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator([
          {
            caip2Id: 'eip155:43114',
            networkType: 'evm',
            id: testAccount.addressC
          }
        ])
      )

      mockMapBalanceResponseToLegacy.mockReturnValue({
        accountId: testAccount.id,
        chainId: 43114,
        tokens: [],
        dataAccurate: true,
        error: null
      })

      // VM module for unsupported chain
      const mockModule = {
        getBalances: jest.fn().mockResolvedValue({
          [testAccount.addressC]: {
            eth: {
              name: 'ETH',
              symbol: 'ETH',
              decimals: 18,
              balance: '0',
              type: TokenType.NATIVE
            }
          }
        })
      }
      mockLoadModuleByNetwork.mockResolvedValue(mockModule)

      await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any, ethereumNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // Ethereum should be retried via VM since it was filtered
      expect(mockLoadModuleByNetwork).toHaveBeenCalledWith(ethereumNetwork)
    })

    it('should not filter non-EVM networks', async () => {
      mockGetSupportedChainsFromCache.mockResolvedValue([
        'eip155:43114' // Only C-Chain EVM supported
      ])

      // Both chains return from API
      mockGetBalancesStream.mockReturnValue(
        createAsyncIterator([
          {
            caip2Id: 'eip155:43114',
            networkType: 'evm',
            id: testAccount.addressC
          },
          {
            caip2Id: 'bip122:000000000019d6689c085ae165831e93',
            networkType: 'btc',
            id: testAccount.addressBTC
          }
        ])
      )

      mockMapBalanceResponseToLegacy
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 43114,
          tokens: [],
          dataAccurate: true,
          error: null
        })
        .mockReturnValueOnce({
          accountId: testAccount.id,
          chainId: 4503599627370475,
          tokens: [],
          dataAccurate: true,
          error: null
        })

      const result = await balanceService.getBalancesForAccount({
        networks: [cChainNetwork as any, btcNetwork as any],
        account: testAccount,
        currency: 'usd',
        xpAddresses: ['avax1test1', 'avax1test2']
      })

      // BTC is not EVM, so it should not be filtered out
      expect(result).toHaveLength(2)
      // No VM fallback needed since both succeeded
      expect(mockLoadModuleByNetwork).not.toHaveBeenCalled()
    })
  })
})
