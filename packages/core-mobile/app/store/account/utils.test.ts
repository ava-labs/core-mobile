import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import AccountsService from 'services/account/AccountsService'
import Logger from 'utils/Logger'
import { Wallet } from 'store/wallet/types'
import { CoreAccountType } from '@avalabs/types'
import { transactionSnackbar } from 'common/utils/toast'
import { WalletState } from 'store/app/types'
import { recentAccountsStore } from 'features/accountSettings/store'
import { Account, AccountCollection } from './types'
import {
  isAddressMissing,
  isHardwareWalletType,
  isMemonicOrSeedlessWallet,
  canRederiveAccountAddresses,
  rederiveAvmPvmAddressesForAccount,
  discoverRemainingActiveAccounts,
  migrateRemainingActiveAccounts
} from './utils'

// Mock dependencies
jest.mock('services/account/AccountsService')
jest.mock('utils/Logger')
jest.mock('services/wallet/WalletFactory')
jest.mock('seedless/services/wallet/SeedlessWallet')
jest.mock('common/utils/toast', () => ({
  transactionSnackbar: {
    pending: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
    plain: jest.fn()
  }
}))
jest.mock('utils/uuid', () => ({
  uuid: jest.fn().mockReturnValue('mock-uuid')
}))
jest.mock('utils/mmkv', () => ({
  ...jest.requireActual('utils/mmkv'),
  commonStorage: {},
  appendToStoredArray: jest.fn(),
  loadArrayFromStorage: jest.fn().mockReturnValue([]),
  zustandPersistStorage: {
    getItem: jest.fn().mockReturnValue(null),
    setItem: jest.fn(),
    removeItem: jest.fn()
  }
}))

const mockGetAddresses = AccountsService.getAddresses as jest.Mock

// Helper to create mock account
const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  id: 'account-1',
  name: 'Account 1',
  type: CoreAccountType.PRIMARY as CoreAccountType.PRIMARY,
  walletId: 'wallet-1',
  index: 0,
  addressC: '0x1234567890abcdef',
  addressBTC: 'bc1q1234567890',
  addressAVM: 'X-avax1234567890',
  addressPVM: 'P-avax1234567890',
  addressCoreEth: '0x1234567890abcdef',
  addressSVM: 'solana1234567890',
  ...overrides
})

// Helper to create mock wallet
const createMockWallet = (overrides: Partial<Wallet> = {}): Wallet => ({
  id: 'wallet-1',
  name: 'Wallet 1',
  type: WalletType.MNEMONIC,
  ...overrides
})

describe('account/utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isAddressMissing', () => {
    it('returns true for undefined', () => {
      expect(isAddressMissing(undefined)).toBe(true)
    })

    it('returns true for null', () => {
      expect(isAddressMissing(null)).toBe(true)
    })

    it('returns true for empty string', () => {
      expect(isAddressMissing('')).toBe(true)
    })

    it('returns false for non-empty string', () => {
      expect(isAddressMissing('X-avax1234567890')).toBe(false)
    })

    it('returns true for whitespace-only string', () => {
      // whitespace-only is not a valid address, so it's considered missing
      expect(isAddressMissing('   ')).toBe(true)
    })
  })

  describe('isMemonicOrSeedlessWallet', () => {
    it('returns true for MNEMONIC wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.MNEMONIC)).toBe(true)
    })

    it('returns true for SEEDLESS wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.SEEDLESS)).toBe(true)
    })

    it('returns false for PRIVATE_KEY wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.PRIVATE_KEY)).toBe(false)
    })

    it('returns false for LEDGER wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.LEDGER)).toBe(false)
    })

    it('returns false for LEDGER_LIVE wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.LEDGER_LIVE)).toBe(false)
    })

    it('returns false for KEYSTONE wallet type', () => {
      expect(isMemonicOrSeedlessWallet(WalletType.KEYSTONE)).toBe(false)
    })
  })

  describe('isHardwareWalletType', () => {
    it('returns true for KEYSTONE wallet type', () => {
      expect(isHardwareWalletType(WalletType.KEYSTONE)).toBe(true)
    })

    it('returns true for LEDGER wallet type', () => {
      expect(isHardwareWalletType(WalletType.LEDGER)).toBe(true)
    })

    it('returns true for LEDGER_LIVE wallet type', () => {
      expect(isHardwareWalletType(WalletType.LEDGER_LIVE)).toBe(true)
    })

    it('returns false for MNEMONIC wallet type', () => {
      expect(isHardwareWalletType(WalletType.MNEMONIC)).toBe(false)
    })

    it('returns false for SEEDLESS wallet type', () => {
      expect(isHardwareWalletType(WalletType.SEEDLESS)).toBe(false)
    })

    it('returns false for PRIVATE_KEY wallet type', () => {
      expect(isHardwareWalletType(WalletType.PRIVATE_KEY)).toBe(false)
    })
  })

  describe('canRederiveAccountXpAddresses', () => {
    it('returns true for MNEMONIC wallet at any index', () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account0 = createMockAccount({ index: 0 })
      const account1 = createMockAccount({ index: 1 })

      expect(canRederiveAccountAddresses(account0, wallet)).toBe(true)
      expect(canRederiveAccountAddresses(account1, wallet)).toBe(true)
    })

    it('returns true for SEEDLESS wallet at any index', () => {
      const wallet = createMockWallet({ type: WalletType.SEEDLESS })
      const account0 = createMockAccount({ index: 0 })
      const account5 = createMockAccount({ index: 5 })

      expect(canRederiveAccountAddresses(account0, wallet)).toBe(true)
      expect(canRederiveAccountAddresses(account5, wallet)).toBe(true)
    })

    it('returns false for hardware wallet at index > 0', () => {
      const keystoneWallet = createMockWallet({ type: WalletType.KEYSTONE })
      const ledgerWallet = createMockWallet({ type: WalletType.LEDGER })
      const account1 = createMockAccount({ index: 1 })

      expect(canRederiveAccountAddresses(account1, keystoneWallet)).toBe(false)
      expect(canRederiveAccountAddresses(account1, ledgerWallet)).toBe(false)
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('requires device connection')
      )
    })

    it('returns false for PRIVATE_KEY wallet', () => {
      const wallet = createMockWallet({ type: WalletType.PRIVATE_KEY })
      const account = createMockAccount({ index: 0 })

      expect(canRederiveAccountAddresses(account, wallet)).toBe(false)
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Skipping account')
      )
    })
  })

  describe('rederiveAvmPvmAddressesForAccount', () => {
    it('returns updated account with new addresses on success', async () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account = createMockAccount({
        addressAVM: '',
        addressPVM: ''
      })

      mockGetAddresses.mockResolvedValue({
        [NetworkVMType.AVM]: 'X-avax-new-address',
        [NetworkVMType.PVM]: 'P-avax-new-address'
      })

      const result = await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode: false
      })

      expect(result).toEqual({
        ...account,
        addressAVM: 'X-avax-new-address',
        addressPVM: 'P-avax-new-address'
      })
      expect(mockGetAddresses).toHaveBeenCalledWith({
        walletId: wallet.id,
        walletType: wallet.type,
        accountIndex: account.index,
        isTestnet: false
      })
    })

    it('preserves existing address if new one is not returned', async () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account = createMockAccount({
        addressAVM: 'X-avax-existing',
        addressPVM: ''
      })

      mockGetAddresses.mockResolvedValue({
        [NetworkVMType.AVM]: undefined,
        [NetworkVMType.PVM]: 'P-avax-new-address'
      })

      const result = await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode: false
      })

      expect(result).toEqual({
        ...account,
        addressAVM: 'X-avax-existing',
        addressPVM: 'P-avax-new-address'
      })
    })

    it('returns null when no addresses are derived', async () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account = createMockAccount({
        addressAVM: '',
        addressPVM: ''
      })

      mockGetAddresses.mockResolvedValue({
        [NetworkVMType.AVM]: undefined,
        [NetworkVMType.PVM]: undefined
      })

      const result = await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode: false
      })

      expect(result).toBeNull()
    })

    it('returns null and logs error on failure', async () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account = createMockAccount({
        addressAVM: '',
        addressPVM: ''
      })

      mockGetAddresses.mockRejectedValue(new Error('Network error'))

      const result = await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode: false
      })

      expect(result).toBeNull()
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to rederive AVM/PVM addresses'),
        expect.any(Error)
      )
    })

    it('passes isDeveloperMode correctly', async () => {
      const wallet = createMockWallet({ type: WalletType.MNEMONIC })
      const account = createMockAccount()

      mockGetAddresses.mockResolvedValue({
        [NetworkVMType.AVM]: 'X-avax-new',
        [NetworkVMType.PVM]: 'P-avax-new'
      })

      await rederiveAvmPvmAddressesForAccount({
        account,
        wallet,
        isDeveloperMode: true
      })

      expect(mockGetAddresses).toHaveBeenCalledWith(
        expect.objectContaining({ isTestnet: true })
      )
    })
  })

  describe('discoverRemainingActiveAccounts', () => {
    const mockFetchRemainingActiveAccounts =
      AccountsService.fetchRemainingActiveAccounts as jest.Mock

    const mockAccounts: AccountCollection = {
      'acc-1': createMockAccount({ id: 'acc-1', index: 1 }),
      'acc-2': createMockAccount({ id: 'acc-2', index: 2 })
    }

    it('returns discovered accounts when found', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: mockAccounts,
        completedCleanly: true
      })

      const result = await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(result.accounts).toEqual(mockAccounts)
      expect(result.accountIds).toEqual(['acc-1', 'acc-2'])
      expect(mockFetchRemainingActiveAccounts).toHaveBeenCalledWith({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })
    })

    it('returns empty when no accounts found', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: {},
        completedCleanly: true
      })

      const result = await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(result.accounts).toEqual({})
      expect(result.accountIds).toEqual([])
    })

    it('shows pending and success toasts for mnemonic wallets', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: mockAccounts,
        completedCleanly: true
      })

      await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(transactionSnackbar.pending).toHaveBeenCalledWith({
        message: 'Adding accounts...',
        toastId: 'mock-uuid'
      })
      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        message: '2 accounts successfully added',
        toastId: 'mock-uuid'
      })
    })

    it('shows plain toast when no accounts found for mnemonic', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: {},
        completedCleanly: true
      })

      await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(transactionSnackbar.plain).toHaveBeenCalledWith({
        message: 'No additional accounts found',
        toastId: 'mock-uuid'
      })
    })

    it('does not show toasts for seedless wallets', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: mockAccounts,
        completedCleanly: true
      })

      await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.SEEDLESS,
        startIndex: 1
      })

      expect(transactionSnackbar.pending).not.toHaveBeenCalled()
      expect(transactionSnackbar.success).not.toHaveBeenCalled()
    })

    it('uses singular "account" for single result', async () => {
      const singleAccount: AccountCollection = {
        'acc-1': createMockAccount({ id: 'acc-1', index: 1 })
      }
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: singleAccount,
        completedCleanly: true
      })

      await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(transactionSnackbar.success).toHaveBeenCalledWith({
        message: '1 account successfully added',
        toastId: 'mock-uuid'
      })
    })

    it('returns empty and shows error toast on failure', async () => {
      mockFetchRemainingActiveAccounts.mockRejectedValue(
        new Error('Network error')
      )

      const result = await discoverRemainingActiveAccounts({
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(result.accounts).toEqual({})
      expect(result.accountIds).toEqual([])
      expect(transactionSnackbar.error).toHaveBeenCalledWith({
        message: 'Failed to add accounts',
        error: 'Network error'
      })
      expect(Logger.error).toHaveBeenCalledWith(
        'Failed to fetch remaining active accounts',
        expect.any(Error)
      )
    })
  })

  describe('migrateRemainingActiveAccounts', () => {
    const mockFetchRemainingActiveAccounts =
      AccountsService.fetchRemainingActiveAccounts as jest.Mock

    const mockDispatch = jest.fn()
    const mockGetState = jest.fn()
    const mockListenerApi = {
      dispatch: mockDispatch,
      getState: mockGetState
    } as unknown as import('store/types').AppListenerEffectAPI

    const mockAccounts: AccountCollection = {
      'acc-1': createMockAccount({ id: 'acc-1', index: 1 }),
      'acc-2': createMockAccount({ id: 'acc-2', index: 2 })
    }

    const createMockState = (walletState: WalletState) =>
      ({
        app: { walletState }
      } as unknown as import('store/types').RootState)

    beforeEach(() => {
      mockGetState.mockReturnValue(createMockState(WalletState.ACTIVE))
    })

    it('sets isMigratingActiveAccounts flag and resets on completion', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: {},
        completedCleanly: true
      })

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wallet/setIsMigratingActiveAccounts',
          payload: true
        })
      )
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wallet/setIsMigratingActiveAccounts',
          payload: false
        })
      )
    })

    it('dispatches accounts in batches for mnemonic wallets', async () => {
      mockFetchRemainingActiveAccounts.mockImplementation(
        async ({ onAccountCreated }) => {
          Object.values(mockAccounts).forEach(account => {
            onAccountCreated?.(account)
          })
          return { accounts: mockAccounts, completedCleanly: true }
        }
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      // Accounts batched and dispatched together (CP-14062)
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'account/setNonActiveAccounts',
          payload: mockAccounts
        })
      )
    })

    it('dispatches setAccounts for seedless wallets', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: mockAccounts,
        completedCleanly: true
      })

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.SEEDLESS,
        startIndex: 1
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'account/setAccounts',
          payload: mockAccounts
        })
      )
    })

    it('does not dispatch intermediate setNonActiveAccounts for seedless wallets', async () => {
      // Seedless XP balance fetching iterates all accounts, so any
      // intermediate setNonActiveAccounts would trigger redundant downstream
      // work in balance/XP listeners. Only the final setAccounts should fire.
      mockFetchRemainingActiveAccounts.mockImplementation(
        async ({ onAccountCreated }) => {
          Object.values(mockAccounts).forEach(account => {
            onAccountCreated?.(account)
          })
          return { accounts: mockAccounts, completedCleanly: true }
        }
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.SEEDLESS,
        startIndex: 1
      })

      const setNonActiveAccountsCalls = mockDispatch.mock.calls.filter(
        ([action]: [{ type?: string }]) =>
          action?.type === 'account/setNonActiveAccounts'
      )
      expect(setNonActiveAccountsCalls).toHaveLength(0)
    })

    it('updates recentAccountsStore when accounts found', async () => {
      const mockAddRecentAccounts = jest.fn()
      jest.spyOn(recentAccountsStore, 'getState').mockReturnValue({
        addRecentAccounts: mockAddRecentAccounts,
        updateRecentAccount: jest.fn(),
        deleteRecentAccounts: jest.fn(),
        recentAccountIds: []
      })
      mockFetchRemainingActiveAccounts.mockImplementation(
        async ({ onAccountCreated }) => {
          Object.values(mockAccounts).forEach(account => {
            onAccountCreated?.(account)
          })
          return {
            accounts: mockAccounts,
            accountIds: Object.keys(mockAccounts),
            completedCleanly: true
          }
        }
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      // Called exactly once from the final setAccounts block, not from
      // batch flushes, to avoid duplicates (addRecentAccounts does not deduplicate).
      expect(mockAddRecentAccounts).toHaveBeenCalledTimes(1)
      expect(mockAddRecentAccounts).toHaveBeenCalledWith(['acc-1', 'acc-2'])
    })

    it('does not dispatch account actions when none found', async () => {
      mockFetchRemainingActiveAccounts.mockResolvedValue({
        accounts: {},
        completedCleanly: true
      })

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      const accountDispatches = mockDispatch.mock.calls.filter(
        ([action]: [{ type: string }]) =>
          action.type === 'account/setNonActiveAccounts' ||
          action.type === 'account/setAccounts'
      )
      expect(accountDispatches).toHaveLength(0)
    })

    it('skips dispatch when wallet is not active', async () => {
      mockGetState.mockReturnValue(createMockState(WalletState.INACTIVE))
      mockFetchRemainingActiveAccounts.mockImplementation(
        async ({ onAccountCreated }) => {
          Object.values(mockAccounts).forEach(account => {
            onAccountCreated?.(account)
          })
          return { accounts: mockAccounts, completedCleanly: true }
        }
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      const accountDispatches = mockDispatch.mock.calls.filter(
        ([action]: [{ type: string }]) =>
          action.type === 'account/setNonActiveAccounts'
      )
      expect(accountDispatches).toHaveLength(0)
      expect(Logger.error).toHaveBeenCalledWith(
        'Wallet is not active, skipping migrateRemainingActiveAccounts'
      )
    })

    it('skips batch flush if wallet becomes inactive mid-discovery', async () => {
      // Return ACTIVE for the initial guard, then INACTIVE for the batch flush
      let callCount = 0
      mockGetState.mockImplementation(() => {
        callCount++
        if (callCount <= 1) return createMockState(WalletState.ACTIVE)
        return createMockState(WalletState.INACTIVE)
      })

      mockFetchRemainingActiveAccounts.mockImplementation(
        async ({ onAccountCreated }) => {
          Object.values(mockAccounts).forEach(account => {
            onAccountCreated?.(account)
          })
          return { accounts: mockAccounts, completedCleanly: true }
        }
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      const accountDispatches = mockDispatch.mock.calls.filter(
        ([action]: [{ type: string }]) =>
          action.type === 'account/setNonActiveAccounts' ||
          action.type === 'account/setAccounts'
      )
      // Batch flush skipped because wallet became inactive
      expect(accountDispatches).toHaveLength(0)
      expect(Logger.error).toHaveBeenCalledWith(
        'Wallet became inactive during discovery, discarding pending batch'
      )
    })

    it('resets isMigratingActiveAccounts even when discovery fails', async () => {
      mockFetchRemainingActiveAccounts.mockRejectedValue(
        new Error('Network error')
      )

      await migrateRemainingActiveAccounts({
        listenerApi: mockListenerApi,
        walletId: 'wallet-1',
        walletType: WalletType.MNEMONIC,
        startIndex: 1
      })

      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'wallet/setIsMigratingActiveAccounts',
          payload: false
        })
      )
    })
  })
})
