import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account, AccountCollection, AccountsState } from 'store/account/types'
import { RootState } from 'store/index'
import { WalletType } from 'services/wallet/types'

export const reducerName = 'account'

const initialState = {
  accounts: {},
  activeAccountIndex: 0
} as AccountsState

const accountsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<AccountCollection>) => {
      state.accounts = action.payload
    },
    setAccount: (state, action: PayloadAction<Account>) => {
      const newAccount = action.payload
      state.accounts[newAccount.index] = newAccount
    },
    setAccountTitle: (
      state,
      action: PayloadAction<{
        accountIndex: number
        title: string
        walletType: WalletType
      }>
    ) => {
      const { accountIndex, title } = action.payload
      const acc = state.accounts[accountIndex]
      if (acc) {
        acc.name = title
      }
    },
    setActiveAccountIndex: (state, action: PayloadAction<number>) => {
      state.activeAccountIndex = action.payload

      // loop through each account and adjust active flag
      Object.values(state.accounts).forEach(acc => {
        acc.active = acc.index === action.payload
      })
    }
  }
})

// selectors
export const selectAccounts = (state: RootState): AccountCollection =>
  state.account.accounts

export const selectAccountByAddress =
  (address?: string) =>
  (state: RootState): Account | undefined => {
    const accounts: Account[] = Object.values(state.account.accounts)

    return accounts.find(
      acc => acc.addressC.toLowerCase() === address?.toLowerCase()
    )
  }

export const selectActiveAccount = (state: RootState): Account | undefined =>
  state.account.accounts[state.account.activeAccountIndex]

export const selectWalletName = (state: RootState): string | undefined =>
  state.account.walletName

// actions
export const {
  setAccountTitle,
  setActiveAccountIndex,
  setAccount,
  setAccounts
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
