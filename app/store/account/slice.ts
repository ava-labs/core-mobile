import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account, AccountCollection, AccountsState } from 'store/account/types'
import { RootState } from 'store/index'

const reducerName = 'account'

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
      action: PayloadAction<{ accountIndex: number; title: string }>
    ) => {
      const { accountIndex, title } = action.payload
      const acc = state.accounts[accountIndex] as Account
      if (acc) {
        acc.title = title
      }
    },
    setActiveAccountIndex: (state, action: PayloadAction<number>) => {
      state.activeAccountIndex = action.payload
    }
  }
})

// selectors
export const selectAccounts = (state: RootState) => state.account.accounts
export const selectAccountByAddress =
  (address?: string) => (state: RootState) =>
    Object.values(state.account.accounts).find(
      acc => acc.address.toLowerCase() === address?.toLowerCase()
    )
export const selectActiveAccount = (state: RootState): Account | undefined =>
  state.account.accounts[state.account.activeAccountIndex]

// actions
export const addAccount = createAction(`${reducerName}/addAccount`)
export const {
  setAccountTitle,
  setActiveAccountIndex,
  setAccount,
  setAccounts
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
