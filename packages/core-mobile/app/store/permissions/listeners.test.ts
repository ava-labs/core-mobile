import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { AppStartListening, AppThunkDispatch } from 'store/types'
import {
  accountsReducer,
  removeAccount,
  setAccounts
} from 'store/account/slice'
import type { Account } from 'store/account/types'
import { walletsReducer } from 'store/wallet/slice'
import { removeWallet } from 'store/wallet/thunks'
import { WalletType } from 'services/wallet/types'
import { grantPermission, permissionsReducer } from './slice'
import { addPermissionsListeners } from './listeners'

// removeWallet's side-effect deps — only the cache clear + secret removal run on
// the path under test; stub them so the real thunk executes synchronously.
jest.mock('utils/BiometricsSDK')
jest.mock('services/account/AccountsService')
jest.mock('services/analytics/AnalyticsService', () => ({
  __esModule: true,
  default: { capture: jest.fn() }
}))
jest.mock('services/wallet/WalletFactory', () => ({
  __esModule: true,
  default: { cache: { clearWallet: jest.fn() } }
}))

const DOMAIN_UNI = 'https://app.uniswap.org'
const DOMAIN_OS = 'https://opensea.io'

const EVM_1 = '0x1111111111111111111111111111111111111111'
const SVM_1 = 'So1ana1111111111111111111111111111111111111'
const BTC_1 = 'bc1qaccount1111111111111111111111111111111'
const EVM_2 = '0x2222222222222222222222222222222222222222'

// Minimal Account stub — the listener only reads id + the per-VM address fields.
const account = (id: string, fields: Partial<Account>): Account =>
  ({ id, walletId: 'wallet-1', ...fields } as unknown as Account)

const listenerMiddleware = createListenerMiddleware()

const setupStore = () => {
  listenerMiddleware.clearListeners()
  const store = configureStore({
    reducer: {
      account: accountsReducer,
      permissions: permissionsReducer
    },
    middleware: gDM =>
      gDM({ serializableCheck: false }).prepend(listenerMiddleware.middleware)
  })
  addPermissionsListeners(
    listenerMiddleware.startListening as AppStartListening
  )
  return store
}

describe('permissions listeners — revoke grants on account removal', () => {
  it("revokes the removed account's grants across all domains, leaving others", () => {
    const store = setupStore()
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: EVM_1, addressBTC: BTC_1 }),
        acc2: account('acc2', { addressC: EVM_2, addressBTC: '' })
      })
    )
    // acc1 (EVM_1) connected to two dApps; acc2 (EVM_2) connected to one.
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_OS,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_2,
        vmType: NetworkVMType.EVM
      })
    )

    store.dispatch(removeAccount('acc1'))

    const { grants } = store.getState().permissions
    // EVM_1 scrubbed everywhere; DOMAIN_OS pruned; EVM_2 untouched.
    expect(grants[DOMAIN_UNI]).toEqual({ [EVM_2]: [NetworkVMType.EVM] })
    expect(grants[DOMAIN_OS]).toBeUndefined()
  })

  it('revokes every VM address the account holds (EVM + Solana + BTC)', () => {
    const store = setupStore()
    store.dispatch(
      setAccounts({
        acc1: account('acc1', {
          addressC: EVM_1,
          addressSVM: SVM_1,
          addressBTC: BTC_1
        })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: SVM_1,
        vmType: NetworkVMType.SVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_OS,
        address: BTC_1,
        vmType: NetworkVMType.BITCOIN
      })
    )

    store.dispatch(removeAccount('acc1'))

    expect(store.getState().permissions.grants).toEqual({})
  })

  it('clears every account when a wallet is removed (removeWallet fans out to removeAccount per account)', () => {
    // store/wallet/thunks.ts removeWallet dispatches removeAccount(account.id)
    // for each account in the wallet, so the per-account listener covers bulk
    // wallet removal. This simulates that fan-out.
    const store = setupStore()
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: EVM_1, addressBTC: BTC_1 }),
        acc2: account('acc2', { addressC: EVM_2, addressBTC: '' })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_2,
        vmType: NetworkVMType.EVM
      })
    )

    store.dispatch(removeAccount('acc1'))
    store.dispatch(removeAccount('acc2'))

    expect(store.getState().permissions.grants).toEqual({})
  })

  it('is a no-op when the removed account had no grants', () => {
    const store = setupStore()
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: EVM_1, addressBTC: BTC_1 }),
        acc2: account('acc2', { addressC: EVM_2, addressBTC: '' })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_2,
        vmType: NetworkVMType.EVM
      })
    )

    store.dispatch(removeAccount('acc1'))

    // Only EVM_2 was ever granted; removing acc1 changes nothing.
    expect(store.getState().permissions.grants).toEqual({
      [DOMAIN_UNI]: { [EVM_2]: [NetworkVMType.EVM] }
    })
  })

  it('keeps a shared address grant until the LAST owning account is removed', () => {
    const store = setupStore()
    const SHARED = EVM_1
    // Same EVM address owned by two accounts in different wallets (e.g. a key
    // imported that also exists under a mnemonic).
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: SHARED, addressBTC: BTC_1 }),
        acc2: account('acc2', {
          addressC: SHARED,
          addressBTC: '',
          walletId: 'wallet-2'
        })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: SHARED,
        vmType: NetworkVMType.EVM
      })
    )

    // Removing one owner must NOT revoke — acc2 still owns SHARED.
    store.dispatch(removeAccount('acc1'))
    expect(store.getState().permissions.grants).toEqual({
      [DOMAIN_UNI]: { [SHARED]: [NetworkVMType.EVM] }
    })

    // Removing the last owner orphans the address → grant revoked.
    store.dispatch(removeAccount('acc2'))
    expect(store.getState().permissions.grants).toEqual({})
  })

  it('treats a shared EVM address case-insensitively when checking surviving owners', () => {
    const store = setupStore()
    const CHECKSUMMED = '0xAbCdEf0000000000000000000000000000000001'
    const LOWER = '0xabcdef0000000000000000000000000000000001'
    // Two accounts own the SAME address under different hex casing.
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: CHECKSUMMED, addressBTC: BTC_1 }),
        acc2: account('acc2', {
          addressC: LOWER,
          addressBTC: '',
          walletId: 'wallet-2'
        })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: CHECKSUMMED,
        vmType: NetworkVMType.EVM
      })
    )

    store.dispatch(removeAccount('acc1'))
    // acc2 owns the same address (different casing) → grant must survive.
    expect(store.getState().permissions.grants[DOMAIN_UNI]).toEqual({
      [CHECKSUMMED]: [NetworkVMType.EVM]
    })
  })

  it('is a no-op when the account is already gone from state', () => {
    const store = setupStore()
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )

    // No account 'acc1' seeded → getOriginalState() lookup misses → no revoke.
    store.dispatch(removeAccount('acc1'))

    expect(store.getState().permissions.grants).toEqual({
      [DOMAIN_UNI]: { [EVM_1]: [NetworkVMType.EVM] }
    })
  })
})

// Integration: run the REAL removeWallet thunk (not a simulated fan-out) so a
// future refactor that stops dispatching removeAccount per account is caught.
describe('permissions listeners — real removeWallet thunk integration', () => {
  it('revokes grants for every account in a removed wallet', async () => {
    listenerMiddleware.clearListeners()
    const store = configureStore({
      reducer: {
        account: accountsReducer,
        permissions: permissionsReducer,
        wallet: walletsReducer
      },
      // Two wallets so removeWallet is allowed (it refuses to remove the last);
      // active = wallet-2 (the one we keep) to skip the active-switch branch.
      preloadedState: {
        wallet: {
          wallets: {
            'wallet-1': {
              id: 'wallet-1',
              name: 'W1',
              type: WalletType.MNEMONIC
            },
            'wallet-2': {
              id: 'wallet-2',
              name: 'W2',
              type: WalletType.MNEMONIC
            }
          },
          activeWalletId: 'wallet-2',
          isMigratingActiveAccounts: false
        }
      },
      middleware: gDM =>
        gDM({ serializableCheck: false }).prepend(listenerMiddleware.middleware)
    })
    addPermissionsListeners(
      listenerMiddleware.startListening as AppStartListening
    )

    // Two accounts in wallet-1 (the account() helper defaults walletId to
    // 'wallet-1'), both connected to a dApp.
    store.dispatch(
      setAccounts({
        acc1: account('acc1', { addressC: EVM_1, addressBTC: BTC_1 }),
        acc2: account('acc2', { addressC: EVM_2, addressBTC: '' })
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_1,
        vmType: NetworkVMType.EVM
      })
    )
    store.dispatch(
      grantPermission({
        domain: DOMAIN_UNI,
        address: EVM_2,
        vmType: NetworkVMType.EVM
      })
    )

    // Real thunk: fans out to removeAccount per account → listener revokes each.
    // Fake timers so the thunk's 250ms persist-flush delay adds no real
    // wall-time and can't flake under CI load.
    jest.useFakeTimers()
    const removal = (store.dispatch as AppThunkDispatch)(
      removeWallet('wallet-1')
    )
    await jest.runAllTimersAsync()
    await removal
    jest.useRealTimers()

    expect(store.getState().permissions.grants).toEqual({})
  })
})
