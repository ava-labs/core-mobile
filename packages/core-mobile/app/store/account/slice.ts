import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Account, AccountCollection, AccountsState } from 'store/account/types'
import { RootState } from 'store/types'
import { WalletType } from 'services/wallet/types'
import { mergeAccounts } from './utils'

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
      // setAccounts does the same thing as setNonActiveAccounts
      // but there are listeners that should only listen and react to setAccounts
      state.accounts = mergeAccounts(state.accounts, action.payload)
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
    },
    setWalletName: (state, action: PayloadAction<string>) => {
      state.walletName = action.payload
    },
    setNonActiveAccounts: (state, action: PayloadAction<AccountCollection>) => {
      state.accounts = mergeAccounts(state.accounts, action.payload)
    }
  }
})

// selectors
export const selectAccounts = (state: RootState): AccountCollection =>
  state.account.accounts

export const selectAccountByAddress =
  (address: string) =>
  (state: RootState): Account | undefined => {
    const accounts: Account[] = Object.values(state.account.accounts)
    const givenAddress = address.toLowerCase()

    return accounts.find(acc => {
      return (
        acc.addressC.toLowerCase() === givenAddress ||
        acc.addressBTC.toLowerCase() === givenAddress ||
        acc.addressAVM.toLowerCase() === givenAddress ||
        acc.addressPVM.toLowerCase() === givenAddress ||
        acc.addressSVM.toLowerCase() === givenAddress
      )
    })
  }

export const selectAccountByIndex =
  (index: number) =>
  (state: RootState): Account | undefined =>
    state.account.accounts[index]

export const selectActiveAccount = (state: RootState): Account | undefined =>
  state.account.accounts[state.account.activeAccountIndex]

export const selectWalletName = (state: RootState): string | undefined =>
  state.account.walletName

// actions
export const {
  setAccountTitle,
  setActiveAccountIndex,
  setAccount,
  setAccounts,
  setWalletName,
  setNonActiveAccounts
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
