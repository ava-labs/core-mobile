import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { createSelector } from 'reselect'
import { RootState } from 'store/types'
import { Wallet, WalletsState } from 'store/wallet/types'
import { WalletType } from 'services/wallet/types'
import { storeWallet } from './thunks'

export const reducerName = 'wallet'

const initialState: WalletsState = {
  wallets: {},
  activeWalletId: null,
  isMigratingActiveAccounts: false
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
        state.wallets[walletId].name = name.trim()
      }
    },
    setActiveWallet: (state, action: PayloadAction<string>) => {
      state.activeWalletId = action.payload
    },
    _removeWallet: (state, action: PayloadAction<string>) => {
      const walletId = action.payload
      const walletIds = Object.keys(state.wallets)

      // Prevent removing the last wallet
      if (walletIds.length <= 1) {
        return
      }

      delete state.wallets[walletId]
    },
    setIsMigratingActiveAccounts: (state, action: PayloadAction<boolean>) => {
      state.isMigratingActiveAccounts = action.payload
    }
  },
  extraReducers: builder => {
    builder.addCase(storeWallet.fulfilled, (state, action) => {
      const wallet = action.payload
      state.wallets[wallet.id] = wallet
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

export const selectSeedlessWallet = (state: RootState): Wallet | undefined =>
  Object.values(state.wallet.wallets).find(
    wallet => wallet.type === WalletType.SEEDLESS
  )

export const selectWalletById =
  (walletId: string) =>
  (state: RootState): Wallet | undefined =>
    state.wallet.wallets[walletId]

export const selectIsMigratingActiveAccounts = (state: RootState): boolean =>
  state.wallet.isMigratingActiveAccounts

// Memoized selectors to avoid repeated Object.values/keys operations
export const selectWalletsArray = createSelector(
  [selectWallets],
  (wallets): Wallet[] => Object.values(wallets)
)

export const selectWalletsCount = createSelector(
  [selectWallets],
  (wallets): number => Object.keys(wallets).length
)

export const selectPrivateKeyWallets = createSelector(
  [selectWalletsArray],
  (wallets): Wallet[] =>
    wallets.filter(wallet => wallet.type === WalletType.PRIVATE_KEY)
)

export const selectRemovableWallets = createSelector(
  [selectWalletsArray],
  (wallets): Wallet[] =>
    wallets.filter(
      w =>
        w.type === WalletType.MNEMONIC ||
        w.type === WalletType.SEEDLESS ||
        w.type === WalletType.KEYSTONE
    )
)

// actions
export const {
  addWallet,
  setWalletName,
  setActiveWallet,
  _removeWallet,
  setIsMigratingActiveAccounts
} = walletsSlice.actions

export const walletsReducer = walletsSlice.reducer
