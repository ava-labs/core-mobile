import { renderHook } from '@testing-library/react-hooks'
import { useDispatch, useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { Wallet } from 'store/wallet/types'
import { selectAccounts } from 'store/account'
import { selectImportedAccounts } from 'store/account/slice'
import {
  selectIsMigratingActiveAccounts,
  selectRemovableWallets
} from 'store/wallet/slice'
import { useManageWallet } from './useManageWallet'

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn()
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: jest.fn() })
}))

jest.mock('features/ledger/store', () => ({
  useLedgerWalletMap: () => ({ removeLedgerWallet: jest.fn() })
}))

jest.mock('services/ledger/LedgerService', () => ({
  __esModule: true,
  default: { disconnect: jest.fn().mockResolvedValue(undefined) }
}))

jest.mock('store/account', () => ({
  addAccount: jest.fn(),
  selectAccounts: jest.fn(),
  setAccount: jest.fn(),
  setActiveAccountId: jest.fn(),
  setLedgerAddresses: jest.fn()
}))

jest.mock('store/account/slice', () => ({
  removeAccount: jest.fn(),
  selectImportedAccounts: jest.fn()
}))

jest.mock('store/wallet/slice', () => ({
  selectIsMigratingActiveAccounts: jest.fn(),
  selectRemovableWallets: jest.fn(),
  setWalletName: jest.fn()
}))

jest.mock('store/wallet/thunks', () => ({
  removeWallet: jest.fn()
}))

const mockUseSelector = useSelector as unknown as jest.MockedFunction<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (selector: any) => any
>

const keystoneWallet: Wallet = {
  id: 'wallet-keystone',
  name: 'Keystone wallet',
  type: WalletType.KEYSTONE
}

const mnemonicWallet: Wallet = {
  id: 'wallet-mnemonic',
  name: 'Mnemonic wallet',
  type: WalletType.MNEMONIC
}

const mnemonicWallet2: Wallet = {
  id: 'wallet-mnemonic-2',
  name: 'Mnemonic wallet 2',
  type: WalletType.MNEMONIC
}

const seedlessWallet: Wallet = {
  id: 'wallet-seedless',
  name: 'Seedless wallet',
  type: WalletType.SEEDLESS
}

const setupSelectors = ({
  walletIdsWithAccounts,
  removableWallets = [],
  isMigratingActiveAccounts = false,
  importedAccounts = []
}: {
  walletIdsWithAccounts: string[]
  removableWallets?: Wallet[]
  isMigratingActiveAccounts?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedAccounts?: any[]
}): void => {
  const accounts = Object.fromEntries(
    walletIdsWithAccounts.map((walletId, index) => [
      `account-${index}`,
      { id: `account-${index}`, walletId }
    ])
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockUseSelector.mockImplementation((selector: any) => {
    if (selector === selectAccounts) return accounts
    if (selector === selectRemovableWallets) return removableWallets
    if (selector === selectIsMigratingActiveAccounts)
      return isMigratingActiveAccounts
    if (selector === selectImportedAccounts) return importedAccounts
    return undefined
  })
}

describe('useManageWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(jest.fn())
  })

  describe('getDropdownItems', () => {
    it('offers only rename and remove for a Keystone wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [seedlessWallet.id, keystoneWallet.id],
        removableWallets: [keystoneWallet]
      })

      const { result } = renderHook(() => useManageWallet())
      const items = result.current.getDropdownItems(keystoneWallet)

      expect(items.map(i => i.id)).toEqual(['rename', 'remove'])
    })

    it('still offers add_account and remove for a Mnemonic wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [mnemonicWallet.id, mnemonicWallet2.id],
        removableWallets: [mnemonicWallet, mnemonicWallet2]
      })

      const { result } = renderHook(() => useManageWallet())
      const items = result.current.getDropdownItems(mnemonicWallet)

      expect(items.map(i => i.id)).toEqual(['rename', 'add_account', 'remove'])
    })

    it('offers rename and add_account but never remove for a Seedless wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [seedlessWallet.id, mnemonicWallet.id],
        removableWallets: [mnemonicWallet]
      })

      const { result } = renderHook(() => useManageWallet())
      const items = result.current.getDropdownItems(seedlessWallet)

      expect(items.map(i => i.id)).toEqual(['rename', 'add_account'])
    })
  })

  describe('canRemoveWallet', () => {
    it('allows removing a Keystone wallet even when it is the only removable wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [seedlessWallet.id, keystoneWallet.id],
        removableWallets: [keystoneWallet]
      })

      const { result } = renderHook(() => useManageWallet())

      expect(
        result.current.getDropdownItems(keystoneWallet).map(i => i.id)
      ).toContain('remove')
    })

    it('blocks removing a Mnemonic wallet when it is the only removable wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [mnemonicWallet.id, seedlessWallet.id],
        removableWallets: [mnemonicWallet]
      })

      const { result } = renderHook(() => useManageWallet())

      expect(
        result.current.getDropdownItems(mnemonicWallet).map(i => i.id)
      ).not.toContain('remove')
    })

    it('never allows removing a Seedless wallet', () => {
      setupSelectors({
        walletIdsWithAccounts: [seedlessWallet.id, mnemonicWallet.id],
        removableWallets: [seedlessWallet, mnemonicWallet]
      })

      const { result } = renderHook(() => useManageWallet())

      expect(
        result.current.getDropdownItems(seedlessWallet).map(i => i.id)
      ).not.toContain('remove')
    })

    it('blocks removing the only wallet regardless of type', () => {
      setupSelectors({
        walletIdsWithAccounts: [keystoneWallet.id],
        removableWallets: [keystoneWallet]
      })

      const { result } = renderHook(() => useManageWallet())

      expect(
        result.current.getDropdownItems(keystoneWallet).map(i => i.id)
      ).not.toContain('remove')
    })
  })
})
