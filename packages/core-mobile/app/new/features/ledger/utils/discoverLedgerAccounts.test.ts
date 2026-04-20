import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { GetBalancesResponse } from 'utils/api/generated/balanceApi.client'
import {
  buildLedgerBalanceRequestItems,
  getActiveAccountIndices,
  LedgerDerivedAccount
} from './discoverLedgerAccounts'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockGetBalances = jest.fn()
jest.mock('utils/api/clients/balanceApiClient', () => ({
  streamingBalanceApiClient: {
    get getBalances() {
      return mockGetBalances()
    }
  }
}))

const mockInit = jest.fn()
const mockLoadModuleByNetwork = jest.fn()
jest.mock('vmModule/ModuleManager', () => ({
  __esModule: true,
  default: {
    get init() {
      return mockInit
    },
    get loadModuleByNetwork() {
      return mockLoadModuleByNetwork
    }
  }
}))

jest.mock('vmModule/utils/mapToVmNetwork', () => ({
  mapToVmNetwork: jest.fn().mockReturnValue({ vmName: 'EVM' })
}))

jest.mock('utils/Logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
}))

jest.mock('services/network/consts', () => ({
  AVALANCHE_MAINNET_NETWORK: { chainId: 43114 },
  defaultEnabledL2ChainIds: [42161, 8453, 10]
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeAccount = (
  index: number,
  overrides: Partial<LedgerDerivedAccount> = {}
): LedgerDerivedAccount => ({
  index,
  addressC: `0xEVM_${index}`,
  addressBTC: `bc1_${index}`,
  xpubXP: `xpub_${index}`,
  addressSVM: `SOL_${index}`,
  ...overrides
})

/**
 * Helper to create an async generator from an array of responses.
 * Used to mock the streaming balance API.
 */
async function* streamResponses(
  responses: GetBalancesResponse[]
): AsyncGenerator<GetBalancesResponse> {
  for (const r of responses) {
    yield r
  }
}

const evmActiveResponse = (
  address: string,
  balance = '1000000000000000000'
): GetBalancesResponse =>
  ({
    id: address,
    networkType: 'evm',
    balances: {
      nativeTokenBalance: { balance }
    }
  } as unknown as GetBalancesResponse)

const btcActiveResponse = (
  address: string,
  balance = '100000'
): GetBalancesResponse =>
  ({
    id: address,
    networkType: 'btc',
    balances: {
      nativeTokenBalance: { balance }
    }
  } as unknown as GetBalancesResponse)

const svmActiveResponse = (
  address: string,
  balance = '1000000000'
): GetBalancesResponse =>
  ({
    id: address,
    networkType: 'svm',
    balances: {
      nativeTokenBalance: { balance }
    }
  } as unknown as GetBalancesResponse)

const avaxActiveResponse = (
  id: string,
  balance = '1000000000'
): GetBalancesResponse =>
  ({
    id,
    networkType: 'avm',
    balances: {
      nativeTokenBalance: { balance }
    }
  } as unknown as GetBalancesResponse)

const pvmActiveResponse = (
  id: string,
  balance = '1000000000'
): GetBalancesResponse =>
  ({
    id,
    networkType: 'pvm',
    balances: {
      nativeTokenBalance: { balance }
    }
  } as unknown as GetBalancesResponse)

const zeroBalanceEvmResponse = (address: string): GetBalancesResponse =>
  ({
    id: address,
    networkType: 'evm',
    balances: {
      nativeTokenBalance: { balance: '0' }
    }
  } as unknown as GetBalancesResponse)

// ---------------------------------------------------------------------------
// buildLedgerBalanceRequestItems
// ---------------------------------------------------------------------------

describe('buildLedgerBalanceRequestItems', () => {
  it('returns empty array for empty input', () => {
    expect(buildLedgerBalanceRequestItems([])).toEqual([])
  })

  it('builds EVM request item', () => {
    const accounts = [
      makeAccount(0, { addressBTC: '', xpubXP: '', addressSVM: undefined })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      namespace: BlockchainNamespace.EIP155,
      addresses: ['0xEVM_0']
    })
  })

  it('builds BTC request item with correct reference', () => {
    const accounts = [
      makeAccount(0, { addressC: '', xpubXP: '', addressSVM: undefined })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      namespace: BlockchainNamespace.BIP122,
      addresses: ['bc1_0']
    })
  })

  it('builds AVAX xpub request item with X and P references', () => {
    const accounts = [
      makeAccount(0, { addressC: '', addressBTC: '', addressSVM: undefined })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    expect(items).toHaveLength(1)
    const avaxItem = items[0]!
    expect(avaxItem).toMatchObject({
      namespace: BlockchainNamespace.AVAX,
      filterOutDustUtxos: false
    })
    expect(
      (avaxItem as Record<string, unknown>).extendedPublicKeyDetails
    ).toEqual([{ id: 'ledger-0', extendedPublicKey: 'xpub_0' }])
  })

  it('builds SVM request item', () => {
    const accounts = [
      makeAccount(0, { addressC: '', addressBTC: '', xpubXP: '' })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      namespace: BlockchainNamespace.SOLANA,
      addresses: ['SOL_0']
    })
  })

  it('builds all four request types for a complete account', () => {
    const accounts = [makeAccount(0)]
    const items = buildLedgerBalanceRequestItems(accounts)

    const namespaces = items.map(i => (i as Record<string, unknown>).namespace)
    expect(namespaces).toContain(BlockchainNamespace.EIP155)
    expect(namespaces).toContain(BlockchainNamespace.BIP122)
    expect(namespaces).toContain(BlockchainNamespace.AVAX)
    expect(namespaces).toContain(BlockchainNamespace.SOLANA)
  })

  it('aggregates addresses from multiple accounts', () => {
    const accounts = [makeAccount(0), makeAccount(1), makeAccount(2)]
    const items = buildLedgerBalanceRequestItems(accounts)

    const evmItem = items.find(
      i =>
        (i as Record<string, unknown>).namespace === BlockchainNamespace.EIP155
    ) as Record<string, unknown>
    expect((evmItem.addresses as string[]).sort()).toEqual([
      '0xEVM_0',
      '0xEVM_1',
      '0xEVM_2'
    ])
  })

  it('skips accounts with missing optional SVM address', () => {
    const accounts = [makeAccount(0, { addressSVM: undefined })]
    const items = buildLedgerBalanceRequestItems(accounts)

    const svmItem = items.find(
      i =>
        (i as Record<string, unknown>).namespace === BlockchainNamespace.SOLANA
    )
    expect(svmItem).toBeUndefined()
  })

  it('uses CAIP-2 reference for BTC mainnet', () => {
    const accounts = [
      makeAccount(0, { addressC: '', xpubXP: '', addressSVM: undefined })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    const btcItem = items[0] as Record<string, unknown>
    const reference = BitcoinCaip2ChainId.MAINNET.split(':')[1]
    expect(btcItem.references).toContain(reference)
  })

  it('uses CAIP-2 references for AVAX X and P chains', () => {
    const accounts = [
      makeAccount(0, { addressC: '', addressBTC: '', addressSVM: undefined })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    const avaxItem = items[0] as Record<string, unknown>
    const xRef = AvalancheCaip2ChainId.X.split(':')[1]
    const pRef = AvalancheCaip2ChainId.P.split(':')[1]
    expect(avaxItem.references).toContain(xRef)
    expect(avaxItem.references).toContain(pRef)
  })

  it('uses CAIP-2 reference for Solana mainnet', () => {
    const accounts = [
      makeAccount(0, { addressC: '', addressBTC: '', xpubXP: '' })
    ]
    const items = buildLedgerBalanceRequestItems(accounts)

    const svmItem = items[0] as Record<string, unknown>
    const reference = SolanaCaip2ChainId.MAINNET.split(':')[1]
    expect(svmItem.references).toContain(reference)
  })
})

// ---------------------------------------------------------------------------
// getActiveAccountIndices
// ---------------------------------------------------------------------------

describe('getActiveAccountIndices', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockInit.mockResolvedValue(undefined)
    mockLoadModuleByNetwork.mockResolvedValue({
      getTransactionHistory: jest.fn().mockResolvedValue({ transactions: [] })
    })
  })

  it('returns [0] for empty accounts array', async () => {
    const result = await getActiveAccountIndices([])
    expect(result).toEqual([0])
  })

  it('returns [0] when no activity is detected', async () => {
    const accounts = [makeAccount(0)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([zeroBalanceEvmResponse('0xEVM_0')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0])
  })

  it('detects active account via EVM balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        evmActiveResponse('0xEVM_0'),
        evmActiveResponse('0xEVM_1')
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects active account via BTC balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([btcActiveResponse('bc1_1')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects active account via SVM balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1), makeAccount(2)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([svmActiveResponse('SOL_2')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1, 2])
  })

  it('detects active account via AVAX X-chain balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([avaxActiveResponse('ledger-1')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects active account via PVM balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([pvmActiveResponse('ledger-1')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('fills gaps between active indices', async () => {
    const accounts = [
      makeAccount(0),
      makeAccount(1),
      makeAccount(2),
      makeAccount(3)
    ]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([evmActiveResponse('0xEVM_3')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1, 2, 3])
  })

  it('always includes index 0 even when only higher indices have activity', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([evmActiveResponse('0xEVM_1')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toContain(0)
    expect(result).toEqual([0, 1])
  })

  it('falls back to C-Chain transaction history for inactive EVM accounts', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]

    // Balance API returns no activity
    mockGetBalances.mockReturnValue(() => streamResponses([]))

    // But C-Chain history shows activity for account 1
    const mockGetTxHistory = jest
      .fn()
      .mockImplementation(({ address }: { address: string }) => {
        if (address === '0xEVM_1') {
          return Promise.resolve({ transactions: [{ hash: '0x123' }] })
        }
        return Promise.resolve({ transactions: [] })
      })

    mockLoadModuleByNetwork.mockResolvedValue({
      getTransactionHistory: mockGetTxHistory
    })

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
    expect(mockGetTxHistory).toHaveBeenCalled()
  })

  it('handles balance API failure gracefully and falls back', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]

    // Streaming throws
    mockGetBalances.mockReturnValue(
      // eslint-disable-next-line require-yield
      async function* () {
        throw new Error('Stream error')
      }
    )

    const result = await getActiveAccountIndices(accounts)
    // Should still return at least [0] even on failure
    expect(result).toContain(0)
  })

  it('handles ModuleManager failure gracefully', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]

    // Balance API returns nothing
    mockGetBalances.mockReturnValue(() => streamResponses([]))

    // ModuleManager throws
    mockInit.mockRejectedValue(new Error('ModuleManager init failed'))

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0])
  })

  it('matches EVM addresses case-insensitively', async () => {
    const accounts = [makeAccount(0)]
    // Response has uppercase, account has mixed case
    mockGetBalances.mockReturnValue(() =>
      streamResponses([evmActiveResponse('0XEVM_0')])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0])
  })

  it('skips responses without an ID', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          networkType: 'evm',
          balances: { nativeTokenBalance: { balance: '1000' } }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    // No ID match, so only index 0
    expect(result).toEqual([0])
  })

  it('skips responses with errors', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: '0xEVM_1',
          error: 'some error',
          networkType: 'evm',
          balances: { nativeTokenBalance: { balance: '1000' } }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    // Error response should be skipped
    expect(result).toEqual([0])
  })

  it('detects activity via ERC-20 token balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: '0xEVM_1',
          networkType: 'evm',
          balances: {
            nativeTokenBalance: { balance: '0' },
            erc20TokenBalances: [{ balance: '500' }]
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects activity via BTC unconfirmed balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: 'bc1_1',
          networkType: 'btc',
          balances: {
            nativeTokenBalance: { balance: '0', unconfirmedBalance: '50000' }
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects activity via SPL token balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: 'SOL_1',
          networkType: 'svm',
          balances: {
            nativeTokenBalance: { balance: '0' },
            splTokenBalances: [{ balance: '1000' }]
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects activity via AVM unlocked category', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: 'ledger-1',
          networkType: 'avm',
          balances: {
            nativeTokenBalance: { balance: '0' },
            categories: {
              unlocked: [{ balance: '1000' }]
            }
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects activity via PVM staked balance', async () => {
    const accounts = [makeAccount(0), makeAccount(1)]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: 'ledger-1',
          networkType: 'pvm',
          balances: {
            nativeTokenBalance: { balance: '0' },
            categories: {
              unlockedStaked: '5000000'
            }
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('detects activity via coreth atomic memory balance', async () => {
    // coreth responses use the raw address as ID (not lowercased like evm).
    // The idToIndex map stores EVM addresses lowercased, so the coreth ID
    // must also be lowercase to match.
    const accounts = [
      makeAccount(0, { addressC: '0xevm_0' }),
      makeAccount(1, { addressC: '0xevm_1' })
    ]
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        {
          id: '0xevm_1',
          networkType: 'coreth',
          balances: {
            nativeTokenBalance: { balance: '0' },
            categories: {
              atomicMemoryUnlocked: {
                'X-chain': [{ balance: '100' }]
              }
            }
          }
        } as unknown as GetBalancesResponse
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1])
  })

  it('returns sorted contiguous range from 0 to max active', async () => {
    const accounts = Array.from({ length: 6 }, (_, i) => makeAccount(i))
    mockGetBalances.mockReturnValue(() =>
      streamResponses([
        evmActiveResponse('0xEVM_1'),
        evmActiveResponse('0xEVM_5')
      ])
    )

    const result = await getActiveAccountIndices(accounts)
    expect(result).toEqual([0, 1, 2, 3, 4, 5])
  })
})
