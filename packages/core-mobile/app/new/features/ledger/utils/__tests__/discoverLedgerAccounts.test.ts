import { GetBalancesResponse } from 'utils/api/generated/balanceApi.client'
import {
  buildLedgerBalanceRequestItems,
  getActiveAccountIndices,
  LedgerDerivedAccount
} from '../discoverLedgerAccounts'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetBalances = jest.fn()

jest.mock('utils/api/clients/balanceApiClient', () => ({
  streamingBalanceApiClient: {
    getBalances: (...args: unknown[]) => mockGetBalances(...args)
  }
}))

jest.mock('utils/Logger', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
}))

jest.mock('@avalabs/core-chains-sdk', () => ({
  BlockchainNamespace: {
    EIP155: 'eip155',
    AVAX: 'avax',
    BIP122: 'bip122',
    SOLANA: 'solana'
  },
  AvalancheCaip2ChainId: {
    X: 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
    P: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo'
  },
  BitcoinCaip2ChainId: {
    MAINNET: 'bip122:000000000019d6689c085ae165831e93'
  },
  SolanaCaip2ChainId: {
    MAINNET: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
  }
}))

jest.mock('services/network/consts', () => ({
  AVALANCHE_MAINNET_NETWORK: {
    chainId: 43114
  }
}))

const mockGetTransactionHistory = jest.fn()

jest.mock('vmModule/ModuleManager', () => ({
  init: jest.fn(),
  loadModuleByNetwork: jest.fn(() => ({
    getTransactionHistory: (...args: unknown[]) =>
      mockGetTransactionHistory(...args)
  }))
}))

jest.mock('vmModule/utils/mapToVmNetwork', () => ({
  mapToVmNetwork: jest.fn(() => ({ chainId: 43114 }))
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock async generator from an array of responses.
 */
function createAsyncGenerator<T>(items: T[]): AsyncGenerator<T> {
  let index = 0
  return {
    next: async () => {
      if (index < items.length) {
        return { value: items[index++] as T, done: false }
      }
      return { value: undefined as unknown as T, done: true }
    },
    return: async () => ({ value: undefined as unknown as T, done: true }),
    throw: async () => ({ value: undefined as unknown as T, done: true }),
    [Symbol.asyncIterator]() {
      return this
    },
    async [Symbol.asyncDispose]() {}
  }
}

const makeAccount = (
  index: number,
  overrides: Partial<LedgerDerivedAccount> = {}
): LedgerDerivedAccount => ({
  index,
  addressC: `0xEVM${index}`,
  addressBTC: `bc1qBTC${index}`,
  xpubXP: `xpub_${index}`,
  addressSVM: `SOL${index}`,
  ...overrides
})

const makeEvmResponse = (
  address: string,
  balance: string
): GetBalancesResponse =>
  ({
    networkType: 'evm',
    caip2Id: 'eip155:43114',
    id: address,
    balances: {
      nativeTokenBalance: {
        name: 'Avalanche',
        symbol: 'AVAX',
        type: 'native' as const,
        decimals: 18,
        balance
      },
      totalBalanceInCurrency: 0,
      erc20TokenBalances: []
    },
    currency: 'usd',
    error: null
  } as unknown as GetBalancesResponse)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('discoverLedgerAccounts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: no transaction history
    mockGetTransactionHistory.mockResolvedValue({ transactions: [] })
  })

  describe('buildLedgerBalanceRequestItems', () => {
    it('builds items for all chain types (EVM, BTC, AVAX xpub, SVM)', () => {
      const accounts = [makeAccount(0), makeAccount(1)]
      const items = buildLedgerBalanceRequestItems(accounts)

      // Should have 4 request items: EVM, BTC, AVAX, SVM
      expect(items).toHaveLength(4)

      const evmItem = items.find(
        item => 'namespace' in item && item.namespace === 'eip155'
      )
      expect(evmItem).toBeDefined()
      expect(evmItem).toMatchObject({
        namespace: 'eip155',
        addresses: ['0xEVM0', '0xEVM1'],
        references: ['43114']
      })

      const btcItem = items.find(
        item => 'namespace' in item && item.namespace === 'bip122'
      )
      expect(btcItem).toBeDefined()
      expect(btcItem).toMatchObject({
        namespace: 'bip122',
        addresses: ['bc1qBTC0', 'bc1qBTC1'],
        references: ['000000000019d6689c085ae165831e93']
      })

      const avaxItem = items.find(
        item =>
          'namespace' in item &&
          item.namespace === 'avax' &&
          'extendedPublicKeyDetails' in item
      )
      expect(avaxItem).toBeDefined()
      expect(avaxItem).toMatchObject({
        namespace: 'avax',
        references: [
          'imji8papUf2EhV3le337w1vgFauqkJg-',
          'Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo'
        ],
        filterOutDustUtxos: false,
        extendedPublicKeyDetails: [
          { id: 'ledger-0', extendedPublicKey: 'xpub_0' },
          { id: 'ledger-1', extendedPublicKey: 'xpub_1' }
        ]
      })

      const svmItem = items.find(
        item => 'namespace' in item && item.namespace === 'solana'
      )
      expect(svmItem).toBeDefined()
      expect(svmItem).toMatchObject({
        namespace: 'solana',
        addresses: ['SOL0', 'SOL1'],
        references: ['5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp']
      })
    })

    it('skips SVM when addresses are missing', () => {
      const accounts = [
        makeAccount(0, { addressSVM: undefined }),
        makeAccount(1, { addressSVM: undefined })
      ]
      const items = buildLedgerBalanceRequestItems(accounts)

      const svmItem = items.find(
        item => 'namespace' in item && item.namespace === 'solana'
      )
      expect(svmItem).toBeUndefined()

      // Should still have EVM, BTC, AVAX = 3 items
      expect(items).toHaveLength(3)
    })
  })

  describe('getActiveAccountIndices', () => {
    it('returns [0] when no activity is found', async () => {
      const accounts = [makeAccount(0), makeAccount(1), makeAccount(2)]

      // All responses show zero balance
      const responses: GetBalancesResponse[] = [
        makeEvmResponse('0xEVM0', '0'),
        makeEvmResponse('0xEVM1', '0'),
        makeEvmResponse('0xEVM2', '0')
      ]

      mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

      const result = await getActiveAccountIndices(accounts)
      expect(result).toEqual([0])
    })

    it('returns active indices based on EVM balance', async () => {
      const accounts = [makeAccount(0), makeAccount(1), makeAccount(2)]

      const responses: GetBalancesResponse[] = [
        makeEvmResponse('0xEVM0', '1000000000000000000'), // index 0 active
        makeEvmResponse('0xEVM1', '0'), // index 1 inactive
        makeEvmResponse('0xEVM2', '500000000000000000') // index 2 active
      ]

      mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

      const result = await getActiveAccountIndices(accounts)
      // Should fill gap: 0 and 2 active -> returns [0, 1, 2]
      expect(result).toEqual([0, 1, 2])
    })

    it('returns contiguous indices up to highest active', async () => {
      const accounts = [
        makeAccount(0),
        makeAccount(1),
        makeAccount(2),
        makeAccount(3),
        makeAccount(4)
      ]

      // Only indices 0 and 3 have activity
      const responses: GetBalancesResponse[] = [
        makeEvmResponse('0xEVM0', '100'),
        makeEvmResponse('0xEVM1', '0'),
        makeEvmResponse('0xEVM2', '0'),
        makeEvmResponse('0xEVM3', '200'),
        makeEvmResponse('0xEVM4', '0')
      ]

      mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

      const result = await getActiveAccountIndices(accounts)
      // Gap-fill from 0..3, trailing index 4 is trimmed
      expect(result).toEqual([0, 1, 2, 3])
    })

    it('handles Balance API failure gracefully and returns [0]', async () => {
      const accounts = [makeAccount(0), makeAccount(1)]

      mockGetBalances.mockReturnValue(
        (async function* () {
          throw new Error('Network error')
        })()
      )

      const result = await getActiveAccountIndices(accounts)
      expect(result).toEqual([0])
    })

    it('detects accounts with zero balance but past C-Chain transaction history', async () => {
      const accounts = [makeAccount(0), makeAccount(1), makeAccount(2)]

      // All balances are zero
      mockGetBalances.mockReturnValue(
        createAsyncGenerator([
          makeEvmResponse('0xEVM0', '0'),
          makeEvmResponse('0xEVM1', '0'),
          makeEvmResponse('0xEVM2', '0')
        ])
      )

      // But index 2 has past transaction history
      mockGetTransactionHistory.mockImplementation(
        async ({ address }: { address: string }) => {
          if (address === '0xEVM2') {
            return { transactions: [{ hash: '0xabc' }] }
          }
          return { transactions: [] }
        }
      )

      const result = await getActiveAccountIndices(accounts)
      // Index 2 has history -> contiguous 0, 1, 2
      expect(result).toEqual([0, 1, 2])
    })

    it('returns [0] when both balance and tx history checks fail', async () => {
      const accounts = [makeAccount(0), makeAccount(1)]

      // Balance API fails
      mockGetBalances.mockReturnValue(
        (async function* () {
          throw new Error('Network error')
        })()
      )

      // Tx history also fails
      mockGetTransactionHistory.mockRejectedValue(
        new Error('Module init failed')
      )

      const result = await getActiveAccountIndices(accounts)
      expect(result).toEqual([0])
    })
  })
})
