import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AccountCollection, AccountsState } from 'store/accounts/types'
import { RootState } from 'store/index'
import { Account } from 'dto/Account'

const reducerName = 'accounts'

const initialState = {
  accounts: {} as AccountCollection,
  activeAccountIndex: 0
} as AccountsState

const accountsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addAccount: (state, action: PayloadAction<Account>) => {
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
export const selectAccounts = (state: RootState) =>
  state.accountsReducer.accounts
export const selectActiveAccount = (state: RootState): Account | undefined =>
  state.accountsReducer.accounts[state.accountsReducer.activeAccountIndex]

// actions
export const { setAccountTitle, setActiveAccountIndex, addAccount } =
  accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
