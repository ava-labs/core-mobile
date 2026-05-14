import { CoreAccountType } from '@avalabs/types'
import { RootState } from 'store/types'
import {
  accountsReducer,
  selectLedgerAddresses,
  selectLedgerAddressesByWalletId,
  setAccounts,
  setNonActiveAccounts
} from './slice'
import { AccountsState, LedgerAddresses, PrimaryAccount } from './types'

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

const makeAccount = (
  overrides: Partial<PrimaryAccount> & { id: string; walletId: string }
): PrimaryAccount => ({
  name: 'Account',
  index: 0,
  addressC: '0xC',
  addressBTC: 'btc',
  addressAVM: 'X-avm',
  addressPVM: 'P-pvm',
  addressCoreEth: '0xCE',
  addressSVM: 'svm',
  ...overrides,
  type: CoreAccountType.PRIMARY
})

// Guards the invariant that the per-wallet final setAccounts dispatch in
// migrateRemainingActiveAccounts (utils.ts) cannot drop accounts belonging
// to a sibling wallet that was discovered concurrently. Both setAccounts
// and setNonActiveAccounts must merge by id, never replace.
describe('accountsReducer — sibling-wallet safety', () => {
  const walletAExisting = makeAccount({ id: 'a1', walletId: 'wallet-A' })
  const walletAUpdated = makeAccount({
    id: 'a1',
    walletId: 'wallet-A',
    addressC: '0xC-updated'
  })
  const walletANew = makeAccount({
    id: 'a2',
    walletId: 'wallet-A',
    index: 1
  })
  const walletBSibling = makeAccount({ id: 'b1', walletId: 'wallet-B' })

  const seededState: AccountsState = {
    accounts: { a1: walletAExisting, b1: walletBSibling },
    activeAccountId: 'a1',
    ledgerAddresses: {}
  }

  it('setAccounts preserves sibling-wallet accounts and merges by id', () => {
    const next = accountsReducer(
      seededState,
      setAccounts({ a1: walletAUpdated, a2: walletANew })
    )

    expect(next.accounts.b1).toEqual(walletBSibling)
    expect(next.accounts.a1).toEqual(walletAUpdated)
    expect(next.accounts.a2).toEqual(walletANew)
    expect(Object.keys(next.accounts).sort()).toEqual(['a1', 'a2', 'b1'])
  })

  it('setNonActiveAccounts preserves sibling-wallet accounts and merges by id', () => {
    const next = accountsReducer(
      seededState,
      setNonActiveAccounts({ a1: walletAUpdated, a2: walletANew })
    )

    expect(next.accounts.b1).toEqual(walletBSibling)
    expect(next.accounts.a1).toEqual(walletAUpdated)
    expect(next.accounts.a2).toEqual(walletANew)
    expect(Object.keys(next.accounts).sort()).toEqual(['a1', 'a2', 'b1'])
  })

  it('setAccounts with an empty payload is a no-op for sibling accounts', () => {
    const next = accountsReducer(seededState, setAccounts({}))

    expect(next.accounts).toEqual(seededState.accounts)
  })
})
