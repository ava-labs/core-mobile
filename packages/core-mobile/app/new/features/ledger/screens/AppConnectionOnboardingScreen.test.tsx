import { GetBalancesResponse } from 'utils/api/generated/balanceApi.client'
import {
  getActiveAccountIndices,
  LedgerDerivedAccount
} from '../utils/discoverLedgerAccounts'

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
  ChainId: {
    AVALANCHE_MAINNET_ID: 43114,
    ETHEREUM_HOMESTEAD: 1
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
  },
  defaultEnabledL2ChainIds: [42161, 8453, 10]
}))

jest.mock('vmModule/ModuleManager', () => ({
  init: jest.fn(),
  loadModuleByNetwork: jest.fn(() => ({
    getTransactionHistory: jest.fn().mockResolvedValue({ transactions: [] })
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
    [Symbol.asyncDispose]: () => Promise.resolve()
  }
}

/**
 * Creates a LedgerDerivedAccount with sensible defaults for all chain addresses.
 */
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

/**
 * Creates a batch of LedgerDerivedAccount entries for indices 0..count-1.
 */
const makeAccounts = (
  count: number,
  overrides?: (index: number) => Partial<LedgerDerivedAccount>
): LedgerDerivedAccount[] =>
  Array.from({ length: count }, (_, i) => makeAccount(i, overrides?.(i)))

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

const makeBtcResponse = (
  address: string,
  balance: string
): GetBalancesResponse =>
  ({
    networkType: 'btc',
    caip2Id: 'bip122:000000000019d6689c085ae165831e93',
    id: address,
    balances: {
      nativeTokenBalance: {
        name: 'Bitcoin',
        symbol: 'BTC',
        type: 'native' as const,
        decimals: 8,
        balance,
        unconfirmedBalance: '0'
      }
    },
    currency: 'usd',
    error: null
  } as unknown as GetBalancesResponse)

const makeSvmResponse = (
  address: string,
  balance: string
): GetBalancesResponse =>
  ({
    networkType: 'svm',
    caip2Id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
    id: address,
    balances: {
      nativeTokenBalance: {
        name: 'Solana',
        symbol: 'SOL',
        type: 'native' as const,
        decimals: 9,
        balance
      },
      splTokenBalances: []
    },
    currency: 'usd',
    error: null
  } as unknown as GetBalancesResponse)

/**
 * Creates an Avalanche X-chain (avm) response keyed by `ledger-{index}` ID.
 */
const makeAvmXpubResponse = (
  index: number,
  balance: string
): GetBalancesResponse =>
  ({
    networkType: 'avm',
    caip2Id: 'avax:imji8papUf2EhV3le337w1vgFauqkJg-',
    id: `ledger-${index}`,
    balances: {
      nativeTokenBalance: {
        name: 'Avalanche',
        symbol: 'AVAX',
        type: 'native' as const,
        decimals: 9,
        balance
      },
      categories: {
        unlocked: [],
        locked: [],
        atomicMemoryUnlocked: {},
        atomicMemoryLocked: {}
      }
    },
    currency: 'usd',
    error: null
  } as unknown as GetBalancesResponse)

/**
 * Creates an Avalanche P-chain (pvm) response keyed by `ledger-{index}` ID.
 */
const makePvmXpubResponse = (
  index: number,
  opts: { stakedBalance?: string; nativeBalance?: string } = {}
): GetBalancesResponse =>
  ({
    networkType: 'pvm',
    caip2Id: 'avax:Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo',
    id: `ledger-${index}`,
    balances: {
      nativeTokenBalance: {
        name: 'Avalanche',
        symbol: 'AVAX',
        type: 'native' as const,
        decimals: 9,
        balance: opts.nativeBalance ?? '0'
      },
      categories: {
        unlockedStaked: opts.stakedBalance ?? '0',
        unlockedUnstaked: '0',
        unlockedUnstakedMultiSig: '0',
        lockedStaked: '0',
        lockedPlatform: '0',
        lockedStakeable: '0',
        atomicMemoryLocked: {},
        atomicMemoryUnlocked: {}
      }
    },
    currency: 'usd',
    error: null
  } as unknown as GetBalancesResponse)

// ---------------------------------------------------------------------------
// Integration Tests – Discovery Flow
// ---------------------------------------------------------------------------

describe('AppConnectionOnboardingScreen – discovery integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -----------------------------------------------------------------------
  // 1. Discovers accounts 0-4 when indices 0, 2, 4 have EVM balance (gap filling)
  // -----------------------------------------------------------------------
  it('discovers accounts 0-4 when indices 0, 2, 4 have EVM balance (gap filling)', async () => {
    const accounts = makeAccounts(6)

    // Indices 0, 2, 4 have EVM balance; 1, 3, 5 are zero.
    const responses: GetBalancesResponse[] = [
      makeEvmResponse('0xEVM0', '1000000000000000000'),
      makeEvmResponse('0xEVM1', '0'),
      makeEvmResponse('0xEVM2', '500000000000000000'),
      makeEvmResponse('0xEVM3', '0'),
      makeEvmResponse('0xEVM4', '250000000000000000'),
      makeEvmResponse('0xEVM5', '0'),
      // All BTC, AVAX, SVM responses show zero
      ...accounts.map(a => makeBtcResponse(a.addressBTC, '0')),
      ...accounts.map(a => makeAvmXpubResponse(a.index, '0')),
      ...accounts.map(a => makePvmXpubResponse(a.index)),
      ...accounts.map(a => makeSvmResponse(a.addressSVM!, '0'))
    ]

    mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

    const result = await getActiveAccountIndices(accounts)

    // Highest active is 4, so gap-fill from 0 to 4 -> [0, 1, 2, 3, 4]
    expect(result).toEqual([0, 1, 2, 3, 4])
  })

  // -----------------------------------------------------------------------
  // 2. Discovers only account 0 when no accounts have activity
  // -----------------------------------------------------------------------
  it('discovers only account 0 when no accounts have activity', async () => {
    const accounts = makeAccounts(5)

    // Every response is zero balance across all chains
    const responses: GetBalancesResponse[] = [
      ...accounts.map(a => makeEvmResponse(a.addressC, '0')),
      ...accounts.map(a => makeBtcResponse(a.addressBTC, '0')),
      ...accounts.map(a => makeAvmXpubResponse(a.index, '0')),
      ...accounts.map(a => makePvmXpubResponse(a.index)),
      ...accounts.map(a => makeSvmResponse(a.addressSVM!, '0'))
    ]

    mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

    const result = await getActiveAccountIndices(accounts)

    expect(result).toEqual([0])
  })

  // -----------------------------------------------------------------------
  // 3. Discovers accounts via Avalanche X/P xpub balance (ledger-{index} IDs)
  // -----------------------------------------------------------------------
  it('discovers accounts via Avalanche X/P xpub balance using ledger-{index} IDs', async () => {
    const accounts = makeAccounts(4)

    // Only AVAX X-chain shows balance on index 3. All other chains are zero.
    const responses: GetBalancesResponse[] = [
      ...accounts.map(a => makeEvmResponse(a.addressC, '0')),
      ...accounts.map(a => makeBtcResponse(a.addressBTC, '0')),
      // X-chain: index 3 has balance
      makeAvmXpubResponse(0, '0'),
      makeAvmXpubResponse(1, '0'),
      makeAvmXpubResponse(2, '0'),
      makeAvmXpubResponse(3, '750000000'),
      // P-chain: all zero
      ...accounts.map(a => makePvmXpubResponse(a.index)),
      ...accounts.map(a => makeSvmResponse(a.addressSVM!, '0'))
    ]

    mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

    const result = await getActiveAccountIndices(accounts)

    // Highest active is 3 via xpub -> gap fill [0, 1, 2, 3]
    expect(result).toEqual([0, 1, 2, 3])
  })

  // -----------------------------------------------------------------------
  // 4. Discovers accounts via Solana balance
  // -----------------------------------------------------------------------
  it('discovers accounts via Solana balance', async () => {
    const accounts = makeAccounts(3)

    // Only SVM shows balance on index 2. All other chains are zero.
    const responses: GetBalancesResponse[] = [
      ...accounts.map(a => makeEvmResponse(a.addressC, '0')),
      ...accounts.map(a => makeBtcResponse(a.addressBTC, '0')),
      ...accounts.map(a => makeAvmXpubResponse(a.index, '0')),
      ...accounts.map(a => makePvmXpubResponse(a.index)),
      makeSvmResponse('SOL0', '0'),
      makeSvmResponse('SOL1', '0'),
      makeSvmResponse('SOL2', '2000000000') // ~2 SOL on index 2
    ]

    mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

    const result = await getActiveAccountIndices(accounts)

    // Highest active is 2 -> [0, 1, 2]
    expect(result).toEqual([0, 1, 2])
  })

  // -----------------------------------------------------------------------
  // 5. Handles mixed chain activity across different indices
  //    (BTC on index 1, P-chain staking on index 5 -> [0,1,2,3,4,5])
  // -----------------------------------------------------------------------
  it('handles mixed chain activity across different indices', async () => {
    const accounts = makeAccounts(7) // indices 0-6

    const responses: GetBalancesResponse[] = [
      // EVM: all zero
      ...accounts.map(a => makeEvmResponse(a.addressC, '0')),
      // BTC: only index 1 has balance
      makeBtcResponse('bc1qBTC0', '0'),
      makeBtcResponse('bc1qBTC1', '50000'), // ~0.0005 BTC
      makeBtcResponse('bc1qBTC2', '0'),
      makeBtcResponse('bc1qBTC3', '0'),
      makeBtcResponse('bc1qBTC4', '0'),
      makeBtcResponse('bc1qBTC5', '0'),
      makeBtcResponse('bc1qBTC6', '0'),
      // X-chain: all zero
      ...accounts.map(a => makeAvmXpubResponse(a.index, '0')),
      // P-chain: index 5 has staked balance
      makePvmXpubResponse(0),
      makePvmXpubResponse(1),
      makePvmXpubResponse(2),
      makePvmXpubResponse(3),
      makePvmXpubResponse(4),
      makePvmXpubResponse(5, { stakedBalance: '25000000000' }), // 25 AVAX staked
      makePvmXpubResponse(6),
      // SVM: all zero
      ...accounts.map(a => makeSvmResponse(a.addressSVM!, '0'))
    ]

    mockGetBalances.mockReturnValue(createAsyncGenerator(responses))

    const result = await getActiveAccountIndices(accounts)

    // BTC on index 1, P-chain on index 5 -> highest active = 5 -> [0,1,2,3,4,5]
    expect(result).toEqual([0, 1, 2, 3, 4, 5])
  })

  // -----------------------------------------------------------------------
  // 6. Handles balance API partial failure gracefully
  //    (some responses succeed, then the generator throws)
  // -----------------------------------------------------------------------
  it('handles balance API partial failure gracefully', async () => {
    const accounts = makeAccounts(3)

    // Generator yields some successful responses then throws an error
    mockGetBalances.mockReturnValue(
      (async function* () {
        yield makeEvmResponse('0xEVM0', '1000000000000000000') // index 0 active
        yield makeEvmResponse('0xEVM2', '500000000000000000') // index 2 active
        throw new Error('Connection reset by peer')
      })()
    )

    const Logger = require('utils/Logger')

    const result = await getActiveAccountIndices(accounts)

    // Partial data from before the error is preserved — indices 0 and 2
    // were detected as active, so the result is contiguous [0, 1, 2]
    expect(result).toEqual([0, 1, 2])

    // Verify the error was logged
    expect(Logger.error).toHaveBeenCalledWith(
      'Failed to check Ledger account activity via Balance API',
      expect.any(Error)
    )
  })
})
