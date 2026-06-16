import { RootState } from 'store/types'
import {
  selectAccountByAddressAndWalletId,
  selectLedgerAddresses,
  selectLedgerAddressesByWalletId
} from './slice'
import { LedgerAddresses } from './types'

const makeLedgerAddress = (
  overrides: Partial<LedgerAddresses> & { id: string; walletId: string }
): LedgerAddresses => ({
  index: 0,
  mainnet: {
    addressBTC: 'btc-mainnet',
    addressAVM: 'avm-mainnet',
    addressPVM: 'pvm-mainnet',
    addressCoreEth: 'coreEth-mainnet'
  },
  testnet: {
    addressBTC: 'btc-testnet',
    addressAVM: 'avm-testnet',
    addressPVM: 'pvm-testnet',
    addressCoreEth: 'coreEth-testnet'
  },
  ...overrides
})

const createMockState = (overrides?: Partial<RootState>): RootState =>
  ({
    account: {
      accounts: {},
      activeAccountId: '',
      ledgerAddresses: {},
      ...((overrides?.account ?? {}) as Record<string, unknown>)
    },
    posthog: {
      flags: {},
      featureFlags: {
        'ledger-support': true,
        everything: true
      },
      ...((overrides?.posthog ?? {}) as Record<string, unknown>)
    },
    ...overrides
  } as unknown as RootState)

describe('selectLedgerAddresses', () => {
  it('returns ledgerAddresses from state', () => {
    const addr = makeLedgerAddress({ id: 'a1', walletId: 'w1' })
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a1: addr }
      }
    } as Partial<RootState>)

    expect(selectLedgerAddresses(state)).toEqual({ a1: addr })
  })

  it('returns empty object when ledgerAddresses is undefined', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: undefined
      }
    } as unknown as Partial<RootState>)

    expect(selectLedgerAddresses(state)).toEqual({})
  })
})

describe('selectLedgerAddressesByWalletId', () => {
  const addr1 = makeLedgerAddress({ id: 'a1', walletId: 'w1', index: 1 })
  const addr2 = makeLedgerAddress({ id: 'a2', walletId: 'w1', index: 0 })
  const addr3 = makeLedgerAddress({ id: 'a3', walletId: 'w2', index: 0 })

  afterEach(() => {
    selectLedgerAddressesByWalletId.clearCache()
  })

  it('filters by walletId and sorts by index', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a1: addr1, a2: addr2, a3: addr3 }
      }
    } as Partial<RootState>)

    const result = selectLedgerAddressesByWalletId(state, 'w1')
    expect(result).toHaveLength(2)
    expect(result[0]?.id).toBe('a2') // index 0 first
    expect(result[1]?.id).toBe('a1') // index 1 second
  })

  it('returns empty array when no addresses match walletId', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a3: addr3 }
      }
    } as Partial<RootState>)

    expect(selectLedgerAddressesByWalletId(state, 'w1')).toEqual([])
  })

  it('returns empty array when ledger support is blocked', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a1: addr1, a2: addr2 }
      },
      posthog: {
        flags: {},
        featureFlags: {
          'ledger-support': false,
          everything: true
        }
      }
    } as unknown as Partial<RootState>)

    expect(selectLedgerAddressesByWalletId(state, 'w1')).toEqual([])
  })

  it('returns empty array when everything flag is disabled', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a1: addr1, a2: addr2 }
      },
      posthog: {
        flags: {},
        featureFlags: {
          'ledger-support': true,
          everything: false
        }
      }
    } as unknown as Partial<RootState>)

    expect(selectLedgerAddressesByWalletId(state, 'w1')).toEqual([])
  })

  it('returns addresses when ledger support is enabled', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: { a1: addr1, a2: addr2 }
      },
      posthog: {
        flags: {},
        featureFlags: {
          'ledger-support': true,
          everything: true
        }
      }
    } as unknown as Partial<RootState>)

    expect(selectLedgerAddressesByWalletId(state, 'w1')).toHaveLength(2)
  })

  it('handles undefined ledgerAddresses with feature flag enabled', () => {
    const state = createMockState({
      account: {
        accounts: {},
        activeAccountId: '',
        ledgerAddresses: undefined
      }
    } as unknown as Partial<RootState>)

    expect(selectLedgerAddressesByWalletId(state, 'w1')).toEqual([])
  })
})

describe('selectAccountByAddressAndWalletId', () => {
  // Same SVM address derived under two different wallets — the exact CP-14468
  // scenario where a dApp-supplied pubkey could resolve to a non-active wallet.
  const SVM_ADDRESS = 'SoLaNaPubKey1111111111111111111111111111111'
  const accountW1 = {
    id: 'w1-0',
    walletId: 'w1',
    index: 0,
    addressC: '0xc1',
    addressBTC: 'btc1',
    addressSVM: SVM_ADDRESS
  }
  const accountW2 = {
    id: 'w2-0',
    walletId: 'w2',
    index: 0,
    addressC: '0xc2',
    addressBTC: 'btc2',
    addressSVM: SVM_ADDRESS
  }

  const stateWith = (...accounts: unknown[]): RootState =>
    createMockState({
      account: {
        accounts: Object.fromEntries(
          accounts.map(a => [(a as { id: string }).id, a])
        ),
        activeAccountId: '',
        ledgerAddresses: {}
      }
    } as unknown as Partial<RootState>)

  it('resolves the account when the address belongs to the given wallet', () => {
    const state = stateWith(accountW1, accountW2)
    expect(selectAccountByAddressAndWalletId('w1', SVM_ADDRESS)(state)).toEqual(
      accountW1
    )
  })

  it('returns undefined when the matching address belongs to a different wallet', () => {
    // Only the non-active wallet holds the address — must NOT resolve to it.
    const state = stateWith(accountW2)
    expect(
      selectAccountByAddressAndWalletId('w1', SVM_ADDRESS)(state)
    ).toBeUndefined()
  })

  it('matches case-insensitively across address fields', () => {
    const state = stateWith(accountW1)
    expect(selectAccountByAddressAndWalletId('w1', '0xC1')(state)).toEqual(
      accountW1
    )
  })
})
