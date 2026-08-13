/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { NetworkVMType, Network, ChainId } from '@avalabs/core-chains-sdk'
import {
  TokenType,
  Transaction as InternalTransaction,
  TransactionType
} from '@avalabs/vm-module-types'
import { getSolanaCaip2ChainId } from 'utils/caip2ChainIds'
import { ActivityService } from './ActivityService'

const SOLANA_CHAIN_ID = ChainId.SOLANA_MAINNET_ID
const SOLANA_CAIP2_ID = getSolanaCaip2ChainId(SOLANA_CHAIN_ID)

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

const mockPostV1TokenLookup = jest.fn()
jest.mock('utils/api/generated/tokenAggregator/aggregatorApi.client', () => ({
  postV1TokenLookup: (...args: unknown[]) => mockPostV1TokenLookup(...args)
}))

jest.mock('utils/api/clients/aggregatedTokensApiClient', () => ({
  tokenAggregatorApi: {}
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

function makeModule(getTransactionHistoryResult?: {
  transactions: any[]
  nextPageToken?: string
}) {
  return {
    getTransactionHistory: jest.fn().mockResolvedValue(
      getTransactionHistoryResult ?? {
        transactions: [],
        nextPageToken: undefined
      }
    )
  }
}

// Builds a `/v1/token/lookup` response, keyed the way the real API keys its
// `data.data` map: `{caip2Id}-{address}`. Confirmed against the live
// endpoint: Solana caip2Ids and base58 addresses come back case-preserved
// (unlike EVM addresses, which the server lowercases).
function lookupKey(address: string): string {
  return `${SOLANA_CAIP2_ID}-${address}`
}

function makeLookupResponse(
  entries: Array<{ address: string; symbol: string; name: string }>
): { data: { data: Record<string, { symbol: string; name: string }> } } {
  const data: Record<string, { symbol: string; name: string }> = {}
  for (const entry of entries) {
    data[lookupKey(entry.address)] = {
      symbol: entry.symbol,
      name: entry.name
    }
  }
  return { data: { data } }
}

// --- Tests ---

describe('ActivityService', () => {
  let service: ActivityService

  beforeEach(() => {
    jest.clearAllMocks()
    service = new ActivityService()
    mockGetAddressByNetwork.mockReturnValue('userSolanaAddress')
    mockGetQueriesData.mockReturnValue([])
    mockPostV1TokenLookup.mockResolvedValue({ data: { data: {} } })
  })

  describe('resolveUnknownTokenSymbols', () => {
    it('should skip resolution for non-SVM networks', async () => {
      const evmNetwork = makeEvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '10')

      const module = makeModule({
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
      expect(mockPostV1TokenLookup).not.toHaveBeenCalled()
    })

    it('should skip resolution when no unknown tokens exist', async () => {
      const network = makeSvmNetwork()
      const knownToken = makeKnownTxToken(USDC_MINT, 'USDC', '10')

      const module = makeModule({
        transactions: [makeTx([knownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      await service.getActivities({
        network,
        account: {} as any
      })

      expect(mockPostV1TokenLookup).not.toHaveBeenCalled()
    })

    it('should resolve unknown tokens from the token-aggregator lookup', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')
      const unknownPump = makeUnknownTxToken(PUMP_MINT, '44.473')

      mockPostV1TokenLookup.mockResolvedValueOnce(
        makeLookupResponse([
          { address: USDC_MINT, symbol: 'USDC', name: 'USD Coin' },
          { address: PUMP_MINT, symbol: 'PUMP', name: 'Pump Token' }
        ])
      )

      const module = makeModule({
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

    it('should resolve unknown tokens from balance cache when the token lookup misses them', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')
      const unknownPump = makeUnknownTxToken(PUMP_MINT, '44.473')

      mockPostV1TokenLookup.mockResolvedValueOnce(
        makeLookupResponse([
          { address: PUMP_MINT, symbol: 'PUMP', name: 'Pump Token' }
        ])
      )

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

      const module = makeModule({
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

    it('should prioritize token-lookup results over balance cache', async () => {
      const network = makeSvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '10')

      mockPostV1TokenLookup.mockResolvedValueOnce(
        makeLookupResponse([
          { address: USDC_MINT, symbol: 'USDC', name: 'USD Coin (Official)' }
        ])
      )

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

      const module = makeModule({
        transactions: [makeTx([unknownToken])],
        nextPageToken: undefined
      })
      mockLoadModuleByNetwork.mockResolvedValue(module)

      const result = await service.getActivities({
        network,
        account: {} as any
      })

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

      const module = makeModule({
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

    it('does not resolve tokens when the response map is keyed with a lowercased address (regression guard: Solana addresses are case-sensitive)', async () => {
      const network = makeSvmNetwork()
      const unknownToken = makeUnknownTxToken(USDC_MINT, '0.1')

      // A lowercased key is what the old (buggy) key-building logic produced
      // and what the real server never returns for Solana -- this must NOT
      // match.
      mockPostV1TokenLookup.mockResolvedValueOnce({
        data: {
          data: {
            [`${SOLANA_CAIP2_ID}-${USDC_MINT.toLowerCase()}`]: {
              symbol: 'USDC',
              name: 'USD Coin'
            }
          }
        }
      })

      const module = makeModule({
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

    it('should handle token-lookup failure gracefully and still try balance cache', async () => {
      const network = makeSvmNetwork()
      const unknownUsdc = makeUnknownTxToken(USDC_MINT, '0.1')

      mockPostV1TokenLookup.mockRejectedValueOnce(new Error('API error'))

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

      const module = makeModule({
        transactions: [makeTx([unknownUsdc])],
        nextPageToken: undefined
      })
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

      mockPostV1TokenLookup.mockResolvedValueOnce(
        makeLookupResponse([
          { address: PUMP_MINT, symbol: 'PUMP', name: 'Pump Token' }
        ])
      )

      const module = makeModule({
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

      const module = makeModule({
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

      mockPostV1TokenLookup.mockResolvedValueOnce(
        makeLookupResponse([
          { address: USDC_MINT, symbol: 'USDC', name: 'USD Coin' },
          { address: PUMP_MINT, symbol: 'PUMP', name: 'Pump Token' }
        ])
      )

      const module = makeModule({
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
