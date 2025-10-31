import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { WalletType } from 'services/wallet/types'
import {
  Account,
  AccountsState,
  AccountCollection,
  PrimaryAccount
} from './types'
import { isPlatformAccount } from './utils'

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
    setActiveAccountId: (state, action: PayloadAction<string>) => {
      state.activeAccountId = action.payload
    },
    setNonActiveAccounts: (state, action: PayloadAction<AccountCollection>) => {
      state.accounts = { ...state.accounts, ...action.payload }
    },
    removeAccount: (state, action: PayloadAction<string>) => {
      const accountId = action.payload
      delete state.accounts[accountId]
    }
  }
})

// selectors
export const selectAllAccounts = (state: RootState): AccountCollection =>
  state.account.accounts

// select all accounts except platform accounts
export const selectAccounts = createSelector(
  [selectAllAccounts],
  (accounts): Account[] =>
    Object.values(accounts).filter(account => !isPlatformAccount(account.id))
)

const _selectPlatformAccounts = createSelector(
  [selectAllAccounts],
  (accounts): Account[] =>
    Object.values(accounts).filter(account => isPlatformAccount(account.id))
)

export const selectAccountByAddress =
  (address: string) =>
  (state: RootState): Account | undefined => {
    const accounts = selectAccounts(state)
    const givenAddress = address.toLowerCase()

    return accounts.find(acc => {
      return (
        acc.addressC.toLowerCase() === givenAddress ||
        acc.addressBTC.toLowerCase() === givenAddress ||
        acc.addressAVM.toLowerCase() === givenAddress ||
        acc.addressPVM.toLowerCase() === givenAddress ||
        acc?.addressSVM?.toLowerCase() === givenAddress
      )
    })
  }

export const selectAccountById =
  (id: string) =>
  (state: RootState): Account | undefined =>
    state.account.accounts[id]

export const selectActiveAccount = (state: RootState): Account | undefined => {
  const activeAccountId = state.account.activeAccountId
  if (!activeAccountId) return undefined

  return state.account.accounts[activeAccountId]
}

export const selectAccountsByWalletId = createSelector(
  [selectAccounts, (_: RootState, walletId: string) => walletId],
  (accounts, walletId) => {
    return accounts
      .filter(account => account.walletId === walletId)
      .sort((a, b) => a.index - b.index)
  }
)

export const selectPlatformAccountsByWalletId = createSelector(
  [_selectPlatformAccounts, (_: RootState, walletId: string) => walletId],
  (accounts, walletId) => {
    return accounts.filter(account => account.walletId === walletId)
  }
)

export const selectAccountByIndex =
  (walletId: string, index: number) =>
  (state: RootState): Account | undefined => {
    const accounts = selectAccounts(state)
    const accountsByWalletId = accounts.filter(
      account => account.walletId === walletId
    )
    const primaryAccount = accountsByWalletId.find(
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
  setNonActiveAccounts,
  removeAccount
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
