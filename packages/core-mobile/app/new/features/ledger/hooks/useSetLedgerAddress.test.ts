import { renderHook, act } from '@testing-library/react-hooks'
import { useDispatch } from 'react-redux'
import { setLedgerAddresses } from 'store/account'
import { LedgerKeys } from 'services/ledger/types'
import { useSetLedgerAddress } from './useSetLedgerAddress'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDispatch = jest.fn()

jest.mock('react-redux', () => ({
  useDispatch: jest.fn()
}))

jest.mock('store/account', () => ({
  setLedgerAddresses: jest.fn((payload: unknown) => ({
    type: 'account/setLedgerAddresses',
    payload
  }))
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeLedgerKeys = (prefix: string): LedgerKeys => ({
  avalancheKeys: {
    addresses: {
      evm: `${prefix}-evm`,
      avm: `${prefix}-avm`,
      pvm: `${prefix}-pvm`,
      coreEth: `${prefix}-coreEth`,
      btc: `${prefix}-btc`
    },
    xpubs: {
      evm: `${prefix}-xpub-evm`,
      avalanche: `${prefix}-xpub-avalanche`
    },
    publicKeys: []
  }
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSetLedgerAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useDispatch as unknown as jest.Mock).mockReturnValue(mockDispatch)
  })

  describe('setLedgerAddressesForMultipleAccounts', () => {
    it('dispatches ledger addresses for all provided accounts with correct mainnet/testnet data', async () => {
      const { result } = renderHook(() => useSetLedgerAddress())

      const entries = [
        {
          walletId: 'wallet-1',
          accountId: 'account-1',
          accountIndex: 0,
          mainnetKeys: makeLedgerKeys('m1'),
          testnetKeys: makeLedgerKeys('t1')
        },
        {
          walletId: 'wallet-1',
          accountId: 'account-2',
          accountIndex: 1,
          mainnetKeys: makeLedgerKeys('m2'),
          testnetKeys: makeLedgerKeys('t2')
        }
      ]

      await act(async () => {
        await result.current.setLedgerAddressesForMultipleAccounts(entries)
      })

      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(setLedgerAddresses).toHaveBeenCalledWith({
        'account-1': {
          mainnet: {
            addressBTC: 'm1-btc',
            addressAVM: 'm1-avm',
            addressPVM: 'm1-pvm',
            addressCoreEth: 'm1-coreEth'
          },
          testnet: {
            addressBTC: 't1-btc',
            addressAVM: 't1-avm',
            addressPVM: 't1-pvm',
            addressCoreEth: 't1-coreEth'
          },
          walletId: 'wallet-1',
          index: 0,
          id: 'account-1'
        },
        'account-2': {
          mainnet: {
            addressBTC: 'm2-btc',
            addressAVM: 'm2-avm',
            addressPVM: 'm2-pvm',
            addressCoreEth: 'm2-coreEth'
          },
          testnet: {
            addressBTC: 't2-btc',
            addressAVM: 't2-avm',
            addressPVM: 't2-pvm',
            addressCoreEth: 't2-coreEth'
          },
          walletId: 'wallet-1',
          index: 1,
          id: 'account-2'
        }
      })
    })

    it('handles empty entries array by dispatching an empty object', async () => {
      const { result } = renderHook(() => useSetLedgerAddress())

      await act(async () => {
        await result.current.setLedgerAddressesForMultipleAccounts([])
      })

      expect(mockDispatch).toHaveBeenCalledTimes(1)
      expect(setLedgerAddresses).toHaveBeenCalledWith({})
    })

    it('handles undefined testnet keys gracefully with empty strings', async () => {
      const { result } = renderHook(() => useSetLedgerAddress())

      const entries = [
        {
          walletId: 'wallet-1',
          accountId: 'account-1',
          accountIndex: 0,
          mainnetKeys: makeLedgerKeys('m1'),
          testnetKeys: undefined
        }
      ]

      await act(async () => {
        await result.current.setLedgerAddressesForMultipleAccounts(entries)
      })

      expect(setLedgerAddresses).toHaveBeenCalledWith({
        'account-1': {
          mainnet: {
            addressBTC: 'm1-btc',
            addressAVM: 'm1-avm',
            addressPVM: 'm1-pvm',
            addressCoreEth: 'm1-coreEth'
          },
          testnet: {
            addressBTC: '',
            addressAVM: '',
            addressPVM: '',
            addressCoreEth: ''
          },
          walletId: 'wallet-1',
          index: 0,
          id: 'account-1'
        }
      })
    })

    it('correctly maps accountIndex and walletId fields', async () => {
      const { result } = renderHook(() => useSetLedgerAddress())

      const entries = [
        {
          walletId: 'wallet-A',
          accountId: 'acct-10',
          accountIndex: 5,
          mainnetKeys: makeLedgerKeys('m'),
          testnetKeys: makeLedgerKeys('t')
        },
        {
          walletId: 'wallet-B',
          accountId: 'acct-20',
          accountIndex: 99,
          mainnetKeys: makeLedgerKeys('m'),
          testnetKeys: makeLedgerKeys('t')
        }
      ]

      await act(async () => {
        await result.current.setLedgerAddressesForMultipleAccounts(entries)
      })

      const call = (setLedgerAddresses as unknown as jest.Mock).mock.calls[0][0]

      // Verify walletId mapping
      expect(call['acct-10'].walletId).toBe('wallet-A')
      expect(call['acct-20'].walletId).toBe('wallet-B')

      // Verify accountIndex mapping
      expect(call['acct-10'].index).toBe(5)
      expect(call['acct-20'].index).toBe(99)

      // Verify id mapping
      expect(call['acct-10'].id).toBe('acct-10')
      expect(call['acct-20'].id).toBe('acct-20')
    })
  })
})
