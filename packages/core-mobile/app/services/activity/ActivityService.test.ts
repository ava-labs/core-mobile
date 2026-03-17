/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  NetworkVMType,
  Network,
  NetworkContractToken,
  ChainId
} from '@avalabs/core-chains-sdk'
import {
  TokenType,
  Transaction as InternalTransaction,
  TransactionType
} from '@avalabs/vm-module-types'
import { ActivityService } from './ActivityService'

const SOLANA_CHAIN_ID = ChainId.SOLANA_MAINNET_ID

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const PUMP_MINT = 'PUMPkefFSVR5uvSKAhGsLGpeDE9w3RGGDbsGPsZrWJo'

// --- Mocks ---

const mockGetAddressByNetwork = jest.fn()
jest.mock('store/account/utils', () => ({
  getAddressByNetwork: (...args: unknown[]) => mockGetAddressByNetwork(...args)
}))

const mockLoadModuleByNetwork = jest.fn()
jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    loadModuleByNetwork: (...args: unknown[]) =>
      mockLoadModuleByNetwork(...args)
  }
}))

jest.mock('vmModule/utils/mapToVmNetwork', () => ({
  mapToVmNetwork: (network: any) => network
}))

const mockGetCachedTokenList = jest.fn()
jest.mock('hooks/networks/useTokenList', () => ({
  getCachedTokenList: () => mockGetCachedTokenList()
}))

const mockGetQueriesData = jest.fn()
jest.mock('contexts/ReactQueryProvider', () => ({
  queryClient: {
    getQueriesData: (...args: unknown[]) => mockGetQueriesData(...args)
  }
}))

jest.mock('consts/reactQueryKeys', () => ({
  ReactQueryKeys: {
    ACCOUNT_BALANCE: 'accountBalance'
  }
}))

jest.mock('./utils/convertTransaction', () => ({
  convertTransaction: (tx: any) => tx
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
}))

// --- Helpers ---

function makeSvmNetwork(overrides: Partial<Network> = {}): Network {
  return {
    chainId: SOLANA_CHAIN_ID,
    chainName: 'Solana',
    vmName: NetworkVMType.SVM,
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    isTestnet: false,
    explorerUrl: 'https://explorer.solana.com',
    logoUri: '',
    networkToken: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    },
    tokens: [],
    ...overrides
  } as Network
}

function makeEvmNetwork(): Network {
  return {
    chainId: 43114,
    chainName: 'Avalanche',
    vmName: NetworkVMType.EVM,
    rpcUrl: 'https://api.avax.network',
    isTestnet: false,
    explorerUrl: 'https://snowtrace.io',
    logoUri: '',
    networkToken: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18
    }
  } as Network
}

function makeSplToken(
  address: string,
  symbol: string,
  name: string
): NetworkContractToken {
  return {
    address,
    symbol,
    name,
    decimals: 6,
    contractType: 'SPL'
  } as NetworkContractToken
}

function makeUnknownTxToken(
  address: string,
  amount: string
): InternalTransaction['tokens'][number] {
  return {
    symbol: 'Unknown',
    name: 'Unknown',
    amount,
    type: TokenType.SPL,
    address,
    decimal: '6',
    from: { address: 'sender123' },
    to: { address: 'receiver456' }
  } as any
}

function makeKnownTxToken(
  address: string,
  symbol: string,
  amount: string
): InternalTransaction['tokens'][number] {
  return {
    symbol,
    name: symbol,
    amount,
    type: TokenType.SPL,
    address,
    decimal: '6',
    from: { address: 'sender123' },
    to: { address: 'receiver456' }
  } as any
}

function makeTx(
  tokens: InternalTransaction['tokens'],
  overrides: Partial<InternalTransaction> = {}
): InternalTransaction {
  return {
    isContractCall: true,
    isIncoming: false,
    isOutgoing: true,
    isSender: true,
    timestamp: Date.now(),
    hash: 'tx-hash-' + Math.random().toString(36).slice(2),
    from: 'sender123',
    to: 'receiver456',
    tokens,
    gasUsed: '5000',
    txType: TransactionType.SWAP,
    chainId: SOLANA_CHAIN_ID.toString(),
    explorerLink: 'https://explorer.solana.com/tx/abc',
    ...overrides
  }
}

function makeModule(
  getTokensResult: any[] = [],
  getTransactionHistoryResult?: { transactions: any[]; nextPageToken?: string }
) {
  return {
    getTokens: jest.fn().mockResolvedValue(getTokensResult),
    getTransactionHistory: jest.fn().mockResolvedValue(
      getTransactionHistoryResult ?? {
        transactions: [],
        nextPageToken: undefined
      }
    )
  }
}

// --- Tests ---

describe('ActivityService', () => {
  let service: ActivityService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ActivityService()
    mockGetAddressByNetwork.mockReturnValue('userSolanaAddress')
    mockGetCachedTokenList.mockResolvedValue({})
    mockGetQueriesData.mockReturnValue([])
  })

  describe('enrichNetworkWithTokens', () => {
    it('should skip enrichment for non-SVM networks', async () => {
      const evmNetwork = makeEvmNetwork()
      const module = makeModule()
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network: evmNetwork,
        account: {} as any
      })

      expect(mockGetCachedTokenList).not.toHaveBeenCalled()
    })

    it('should merge token list tokens with existing network tokens', async () => {
      const existingToken = makeSplToken(USDC_MINT, 'USDC', 'USD Coin')
      const newToken = makeSplToken(PUMP_MINT, 'PUMP', 'Pump Token')

      const network = makeSvmNetwork({ tokens: [existingToken] })

      mockGetCachedTokenList.mockResolvedValue({
        [SOLANA_CHAIN_ID]: {
          tokens: [
            makeSplToken(USDC_MINT, 'USDC-dup', 'USDC Duplicate'),
            newToken
          ]
        }
      })

      const module = makeModule()
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network,
        account: {} as any
      })

      // The network passed to getTransactionHistory should have merged tokens
      const passedNetwork =
        module.getTransactionHistory.mock.calls[0]![0].network
      expect(passedNetwork.tokens).toHaveLength(2)
      // Existing token preserved (not duplicated)
      expect(passedNetwork.tokens[0].symbol).toBe('USDC')
      // New token added
      expect(passedNetwork.tokens[1].symbol).toBe('PUMP')
    })

    it('should return network unchanged when token list is empty', async () => {
      const network = makeSvmNetwork()
      mockGetCachedTokenList.mockResolvedValue({
        [SOLANA_CHAIN_ID]: { tokens: [] }
      })

      const module = makeModule()
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network,
        account: {} as any
      })

      const passedNetwork =
        module.getTransactionHistory.mock.calls[0]![0].network
      expect(passedNetwork.tokens).toEqual([])
    })

    it('should handle getCachedTokenList failure gracefully', async () => {
      const network = makeSvmNetwork()
      mockGetCachedTokenList.mockRejectedValue(new Error('Network error'))

      const module = makeModule()
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network,
        account: {} as any
      })

      // Should still proceed with the original network
      const passedNetwork =
        module.getTransactionHistory.mock.calls[0]![0].network
      expect(passedNetwork.tokens).toEqual([])
    })
  })

  describe('resolveUnknownTokenSymbols', () => {
    it('should skip resolution for non-SVM networks', async () => {
      const evmNetwork = makeEvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '10')

      const module = makeModule([], {
        transactions: [makeTx([unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network: evmNetwork,
        account: {} as any
      })

      // Token should remain Unknown since resolution is skipped for EVM
      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('Unknown')
      expect(module.getTokens).not.toHaveBeenCalled()
    })

    it('should skip resolution when no unknown tokens exist', async () => {
      const network = makeSvmNetwork()
      const knownToken = makeKnownTxToken(USDC_MINT, 'USDC', '10')

      const module = makeModule([], {
        transactions: [makeTx([knownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network,
        account: {} as any
      })

      expect(module.getTokens).not.toHaveBeenCalled()
    })

    it('should resolve unknown tokens from module token registry', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')
      const unknownPump = makeUnknownTxToken(PUMP_MINT, '44.473')

      const moduleTokens = [
        {
          address: USDC_MINT,
          symbol: 'USDC',
          name: 'USD Coin',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        },
        {
          address: PUMP_MINT,
          symbol: 'PUMP',
          name: 'Pump Token',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        }
      ]

      const module = makeModule(moduleTokens, {
        transactions: [makeTx([unknownUsdc, unknownPump])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[0]!.tokens[0]!.name).toBe('USD Coin')
      expect(result.transactions[0]!.tokens[1]!.symbol).toBe('PUMP')
      expect(result.transactions[0]!.tokens[1]!.name).toBe('Pump Token')
    })

    it('should resolve unknown tokens from balance cache when module registry misses them', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')
      const unknownPump = makeUnknownTxToken(PUMP_MINT, '44.473')

      // Module only has PUMP, not USDC
      const moduleTokens = [
        {
          address: PUMP_MINT,
          symbol: 'PUMP',
          name: 'Pump Token',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        }
      ]

      // Balance cache has USDC from user's portfolio
      mockGetQueriesData.mockReturnValue([
        [
          ['accountBalance', 'account-1'],
          [
            {
              chainId: SOLANA_CHAIN_ID,
              tokens: [
                {
                  address: USDC_MINT,
                  symbol: 'USDC',
                  name: 'USD Coin',
                  type: TokenType.SPL,
                  decimals: 6,
                  balance: 1000000n,
                  balanceDisplayValue: '1.0',
                  localId: 'usdc-local',
                  isDataAccurate: true,
                  networkChainId: SOLANA_CHAIN_ID
                }
              ]
            }
          ]
        ]
      ])

      const module = makeModule(moduleTokens, {
        transactions: [makeTx([unknownUsdc, unknownPump])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[0]!.tokens[0]!.name).toBe('USD Coin')
      expect(result.transactions[0]!.tokens[1]!.symbol).toBe('PUMP')
      expect(result.transactions[0]!.tokens[1]!.name).toBe('Pump Token')
    })

    it('should prioritize module tokens over balance cache', async () => {
      const network = makeSvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '10')

      // Module returns one name
      const moduleTokens = [
        {
          address: USDC_MINT,
          symbol: 'USDC',
          name: 'USD Coin (Official)',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        }
      ]

      // Balance cache has a different name
      mockGetQueriesData.mockReturnValue([
        [
          ['accountBalance', 'account-1'],
          [
            {
              chainId: SOLANA_CHAIN_ID,
              tokens: [
                {
                  address: USDC_MINT,
                  symbol: 'USDC-old',
                  name: 'USDC From Cache',
                  type: TokenType.SPL,
                  decimals: 6,
                  balance: 0n,
                  balanceDisplayValue: '0',
                  localId: 'usdc-local',
                  isDataAccurate: true,
                  networkChainId: SOLANA_CHAIN_ID
                }
              ]
            }
          ]
        ]
      ])

      const module = makeModule(moduleTokens, {
        transactions: [makeTx([unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      // Module source should win
      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[0]!.tokens[0]!.name).toBe(
        'USD Coin (Official)'
      )
    })

    it('should leave tokens as Unknown when no source can resolve them', async () => {
      const network = makeSvmNetwork()
      const unknownToken = makeUnknownTxToken(
        'SomeRandomMintAddress123456789',
        '999'
      )

      const module = makeModule([], {
        transactions: [makeTx([unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('Unknown')
    })

    it('should handle module.getTokens failure gracefully and still try balance cache', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')

      // Balance cache has USDC
      mockGetQueriesData.mockReturnValue([
        [
          ['accountBalance', 'account-1'],
          [
            {
              chainId: SOLANA_CHAIN_ID,
              tokens: [
                {
                  address: USDC_MINT,
                  symbol: 'USDC',
                  name: 'USD Coin',
                  type: TokenType.SPL,
                  decimals: 6,
                  balance: 1000000n,
                  balanceDisplayValue: '1.0',
                  localId: 'usdc-local',
                  isDataAccurate: true,
                  networkChainId: SOLANA_CHAIN_ID
                }
              ]
            }
          ]
        ]
      ])

      const module = makeModule([], {
        transactions: [makeTx([unknownUsdc])],
        nextPageToken: undefined
      })
      // Simulate getTokens failure
      module.getTokens.mockRejectedValue(new Error('API error'))
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      // Should still resolve from balance cache
      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[0]!.tokens[0]!.name).toBe('USD Coin')
    })

    it('should not modify already-known tokens', async () => {
      const network = makeSvmNetwork()
      const knownToken = makeKnownTxToken(USDC_MINT, 'USDC', '10')
      const unknownToken = makeUnknownTxToken(PUMP_MINT, '44')

      const moduleTokens = [
        {
          address: PUMP_MINT,
          symbol: 'PUMP',
          name: 'Pump Token',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        }
      ]

      const module = makeModule(moduleTokens, {
        transactions: [makeTx([knownToken, unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[0]!.tokens[1]!.symbol).toBe('PUMP')
    })

    it('should ignore balance cache entries for different chain IDs', async () => {
      const network = makeSvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '10')

      // Balance cache has USDC but for a different chain
      mockGetQueriesData.mockReturnValue([
        [
          ['accountBalance', 'account-1'],
          [
            {
              chainId: 43114, // Avalanche, not Solana
              tokens: [
                {
                  address: USDC_MINT,
                  symbol: 'USDC.e',
                  name: 'Bridged USDC',
                  type: TokenType.ERC20,
                  decimals: 6,
                  balance: 1000000n,
                  balanceDisplayValue: '1.0',
                  localId: 'usdc-e-local',
                  isDataAccurate: true,
                  networkChainId: 43114
                }
              ]
            }
          ]
        ]
      ])

      const module = makeModule([], {
        transactions: [makeTx([unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      // Should NOT resolve from a different chain's data
      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('Unknown')
    })

    it('should resolve unknown tokens across multiple transactions', async () => {
      const network = makeSvmNetwork()

      const tx1 = makeTx([makeUnknownTxToken(USDC_MINT, '5')])
      const tx2 = makeTx([makeUnknownTxToken(PUMP_MINT, '100')])

      const moduleTokens = [
        {
          address: USDC_MINT,
          symbol: 'USDC',
          name: 'USD Coin',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        },
        {
          address: PUMP_MINT,
          symbol: 'PUMP',
          name: 'Pump Token',
          type: TokenType.SPL,
          contractType: TokenType.SPL,
          decimals: 6
        }
      ]

      const module = makeModule(moduleTokens, {
        transactions: [tx1, tx2],
        nextPageToken: 'page2'
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

      expect(result.transactions[0]!.tokens[0]!.symbol).toBe('USDC')
      expect(result.transactions[1]!.tokens[0]!.symbol).toBe('PUMP')
      expect(result.nextPageToken).toBe('page2')
    })
  })
})
