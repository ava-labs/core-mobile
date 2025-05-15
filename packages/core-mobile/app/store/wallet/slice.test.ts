import { WalletType } from 'services/wallet/types'
import {
  walletsReducer,
  addWallet,
  setWalletName,
  setActiveWallet,
  removeWallet
} from './slice'

describe('wallet slice', () => {
  const initialState = {
    wallets: {},
    activeWalletId: null
  }

  const mockWallet = {
    id: 'test-wallet-1',
    name: 'Test Wallet 1',
    mnemonic: 'test-mnemonic',
    type: WalletType.MNEMONIC,
    isActive: true
  }

  const mockWallet2 = {
    id: 'test-wallet-2',
    name: 'Test Wallet 2',
    mnemonic: 'test-mnemonic-2',
    type: WalletType.MNEMONIC,
    isActive: true
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

  it('should handle removeWallet', () => {
    const state = {
      ...initialState,
      wallets: {
        [mockWallet.id]: mockWallet,
        [mockWallet2.id]: mockWallet2
      },
      activeWalletId: mockWallet.id
    }
    const actual = walletsReducer(state, removeWallet(mockWallet.id))
    expect(actual.wallets[mockWallet.id]).toBeUndefined()
    expect(actual.activeWalletId).toBe(mockWallet2.id)
  })

  it('should not remove the last wallet', () => {
    const state = {
      ...initialState,
      wallets: { [mockWallet.id]: mockWallet },
      activeWalletId: mockWallet.id
    }
    const actual = walletsReducer(state, removeWallet(mockWallet.id))
    expect(actual).toEqual(state)
  })
})
