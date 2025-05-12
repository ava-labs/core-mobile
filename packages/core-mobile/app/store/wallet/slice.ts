import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { Wallet, WalletsState } from 'store/wallet/types'
import { storeWalletWithPin } from './thunks'

export const reducerName = 'wallet'

const initialState: WalletsState = {
  wallets: {},
  activeWalletId: null
}

const walletsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addWallet: (state, action: PayloadAction<Wallet>) => {
      const newWallet = action.payload
      state.wallets[newWallet.id] = newWallet
    },
    setWalletName: (
      state,
      action: PayloadAction<{ walletId: string; name: string }>
    ) => {
      const { walletId, name } = action.payload
      if (state.wallets[walletId]) {
        state.wallets[walletId].name = name
      }
    },
    setActiveWallet: (state, action: PayloadAction<string>) => {
      state.activeWalletId = action.payload
    },
    removeWallet: (state, action: PayloadAction<string>) => {
      const walletId = action.payload
      const walletIds = Object.keys(state.wallets)

      // Prevent removing the last wallet
      if (walletIds.length <= 1) {
        return
      }

      delete state.wallets[walletId]

      // If we removed the active wallet, set the next one as active
      if (state.activeWalletId === walletId) {
        const currentIndex = walletIds.indexOf(walletId)
        const nextWalletId = walletIds[currentIndex + 1] || walletIds[0]
        if (nextWalletId && state.wallets[nextWalletId]) {
          state.activeWalletId = nextWalletId
        }
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(storeWalletWithPin.fulfilled, (state, action) => {
      const wallet = action.payload
      state.wallets[wallet.id] = wallet
      state.activeWalletId = wallet.id
    })
  }
})

// selectors
export const selectWallets = (state: RootState): { [key: string]: Wallet } =>
  state.wallet.wallets

export const selectActiveWalletId = (state: RootState): string | null =>
  state.wallet.activeWalletId

export const selectActiveWallet = (state: RootState): Wallet | undefined =>
  state.wallet.activeWalletId
    ? state.wallet.wallets[state.wallet.activeWalletId]
    : undefined

export const selectWalletById =
  (walletId: string) =>
  (state: RootState): Wallet | undefined =>
    state.wallet.wallets[walletId]

// actions
export const { addWallet, setWalletName, setActiveWallet, removeWallet } =
  walletsSlice.actions

export const walletsReducer = walletsSlice.reducer
