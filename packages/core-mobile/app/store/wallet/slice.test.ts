import { WalletType } from 'services/wallet/types'
import {
  walletsReducer,
  addWallet,
  setWalletName,
  setActiveWallet,
  _removeWallet
} from './slice'
import { storeWallet } from './thunks'

describe('wallet slice', () => {
  const initialState = {
    wallets: {},
    activeWalletId: null
  }

  const mockWallet = {
    id: 'test-wallet-1',
    name: 'Test Wallet 1',
    type: WalletType.MNEMONIC
  }

  const mockWallet2 = {
    id: 'test-wallet-2',
    name: 'Test Wallet 2',
    type: WalletType.MNEMONIC
  }

  it('should handle initial state', () => {
    expect(walletsReducer(undefined, { type: 'unknown' })).toEqual(initialState)
  })

  it('should handle addWallet', () => {
    const actual = walletsReducer(initialState, addWallet(mockWallet))
    expect(actual.wallets[mockWallet.id]).toEqual(mockWallet)
  })

  it('should handle setWalletName', () => {
    const state = {
      ...initialState,
      wallets: { [mockWallet.id]: mockWallet }
    }
    const newName = 'Updated Wallet Name'
    const actual = walletsReducer(
      state,
      setWalletName({ walletId: mockWallet.id, name: newName })
    )
    const updatedWallet = actual.wallets[mockWallet.id]
    expect(updatedWallet).toBeDefined()
    expect(updatedWallet?.name).toEqual(newName)
  })

  it('should handle setActiveWallet', () => {
    const state = {
      ...initialState,
      wallets: {
        [mockWallet.id]: mockWallet,
        [mockWallet2.id]: mockWallet2
      },
      activeWalletId: mockWallet2.id
    }
    const actual = walletsReducer(state, setActiveWallet(mockWallet.id))
    expect(actual.activeWalletId).toBe(mockWallet.id)
  })

  it('should handle _removeWallet when multiple wallets exist', () => {
    const state = {
      ...initialState,
      wallets: {
        [mockWallet.id]: mockWallet,
        [mockWallet2.id]: mockWallet2
      },
      activeWalletId: mockWallet.id
    }
    const actual = walletsReducer(state, _removeWallet(mockWallet.id))
    expect(actual.wallets[mockWallet.id]).toBeUndefined()
    expect(actual.wallets[mockWallet2.id]).toEqual(mockWallet2)
    // _removeWallet doesn't change activeWalletId - that's handled by the thunk
    expect(actual.activeWalletId).toBe(mockWallet.id)
  })

  it('should not remove the last wallet', () => {
    const state = {
      ...initialState,
      wallets: { [mockWallet.id]: mockWallet },
      activeWalletId: mockWallet.id
    }
    const actual = walletsReducer(state, _removeWallet(mockWallet.id))
    expect(actual).toEqual(state)
  })

  describe('storeWallet thunk', () => {
    it('should handle storeWallet.fulfilled', () => {
      const walletToStore = {
        id: 'new-wallet-id',
        name: 'New Wallet',
        type: WalletType.PRIVATE_KEY
      }

      const action = {
        type: storeWallet.fulfilled.type,
        payload: walletToStore
      }

      const actual = walletsReducer(initialState, action)
      expect(actual.wallets[walletToStore.id]).toEqual(walletToStore)
    })
  })
})
