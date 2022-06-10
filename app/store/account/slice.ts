import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AccountCollection, AccountsState } from 'store/account/types'
import { RootState } from 'store/index'
import { Account } from 'dto/Account'
import accountService from 'services/account/AccountsService'
import { AppStartListening } from 'store/middleware/listener'
import { selectActiveNetwork } from 'store/network'

const reducerName = 'account'

const initialState = {
  accounts: {} as AccountCollection,
  activeAccountIndex: 0
} as AccountsState

const accountsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    persistAccount: (state, action: PayloadAction<Account>) => {
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
export const selectActiveAccount = (state: RootState): Account | undefined =>
  state.account.accounts[state.account.activeAccountIndex]

// actions
export const addAccount = createAction(`${reducerName}/addAccount`)
export const { setAccountTitle, setActiveAccountIndex, persistAccount } =
  accountsSlice.actions

// listeners
export const addAccountListener = (startListening: AppStartListening) => {
  startListening({
    actionCreator: addAccount,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()
      const activeNetwork = selectActiveNetwork(state)
      const accounts = selectAccounts(state)
      const acc = await accountService.createNextAccount(
        activeNetwork,
        accounts
      )

      listenerApi.dispatch(persistAccount(acc))
      listenerApi.dispatch(setActiveAccountIndex(acc.index))
    }
  })
}

export const accountsReducer = accountsSlice.reducer
