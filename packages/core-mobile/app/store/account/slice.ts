import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  AccountsState,
  AccountCollection,
  PrimaryAccount
} from './types'

export const reducerName = 'account'

const initialState = {
  accounts: {},
  activeAccountId: ''
} as AccountsState

const accountsSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setAccounts: (state, action: PayloadAction<AccountCollection>) => {
      // setAccounts does the same thing as setNonActiveAccounts
      // but there are listeners that should only listen and react to setAccounts
      state.accounts = { ...state.accounts, ...action.payload }
    },
    setAccount: (state, action: PayloadAction<Account>) => {
      const newAccount = action.payload
      state.accounts[newAccount.id] = newAccount
    },
    setAccountTitle: (
      state,
      action: PayloadAction<{
        accountId: string
        title: string
        walletType: WalletType
      }>
    ) => {
      const { accountId, title } = action.payload
      const account = state.accounts[accountId]
      if (account) {
        account.name = title
      }
    },
    setActiveAccountId: (state, action: PayloadAction<string | null>) => {
      state.activeAccountId = action.payload
      // Update active flag for all accounts
      Object.values(state.accounts).forEach(acc => {
        acc.active = acc.id === action.payload
      })
    },
    setNonActiveAccounts: (state, action: PayloadAction<AccountCollection>) => {
      state.accounts = { ...state.accounts, ...action.payload }
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
        acc.addressPVM.toLowerCase() === givenAddress
      )
    })
  }

//NEVEN: check if this is used anywhere
export const selectAccountByUuid =
  (uuid: string) =>
  (state: RootState): Account | undefined =>
    state.account.accounts[uuid]

export const selectActiveAccount = (state: RootState): Account | undefined => {
  const activeAccountId = state.account.activeAccountId
  if (!activeAccountId) return undefined

  return state.account.accounts[activeAccountId]
}

export const selectAccountsByWalletId =
  (walletId: string) =>
  (state: RootState): Account[] => {
    return Object.values(state.account.accounts)
      .filter(account => account.walletId === walletId)
      .sort((a, b) => {
        //sort by index if it exists
        if ('index' in a && 'index' in b) {
          return a.index - b.index
        }
        return 0
      })
  }

export const selectAccountByIndex =
  (index: number) =>
  (state: RootState): Account | undefined => {
    const accounts = Object.values(state.account.accounts)
    const primaryAccount = accounts.find(
      (account): account is PrimaryAccount =>
        'index' in account && account.index === index
    )
    return primaryAccount || accounts[0]
  }

// actions
export const {
  setAccountTitle,
  setActiveAccountId,
  setAccount,
  setAccounts,
  setNonActiveAccounts
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
