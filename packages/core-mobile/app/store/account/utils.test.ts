import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { WalletType } from 'services/wallet/types'
import AccountsService from 'services/account/AccountsService'
import Logger from 'utils/Logger'
import { Wallet } from 'store/wallet/types'
import { CoreAccountType } from '@avalabs/types'
import { Account } from './types'
import {
  isAddressMissing,
  isHardwareWalletType,
  isMemonicOrSeedlessWallet,
  canRederiveAccountAddresses,
  rederiveAvmPvmAddressesForAccount
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
    error: jest.fn()
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
})
