import { createSlice, PayloadAction, createSelector } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { WalletType } from 'services/wallet/types'
import { CoreAccountType } from '@avalabs/types'
import {
  selectIsLedgerSupportBlocked,
  selectIsSolanaSupportBlocked
} from 'store/posthog'
import {
  Account,
  AccountsState,
  AccountCollection,
  PrimaryAccount,
  LedgerAddressesCollection
} from './types'

export const reducerName = 'account'

const initialState = {
  accounts: {},
  activeAccountId: '',
  ledgerAddresses: {}
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
    setLedgerAddresses: (
      state,
      action: PayloadAction<LedgerAddressesCollection>
    ) => {
      state.ledgerAddresses = {
        ...state.ledgerAddresses,
        ...action.payload
      }
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
    },
    removeLedgerAddress: (state, action: PayloadAction<string>) => {
      const accountId = action.payload
      delete state.ledgerAddresses[accountId]
    }
  }
})

// selectors
export const selectAccounts = (state: RootState): AccountCollection =>
  state.account.accounts

export const selectLedgerAddresses = (
  state: RootState
): LedgerAddressesCollection => state.account.ledgerAddresses ?? {}

export const selectAccountByAddress =
  (address: string) =>
  (state: RootState): Account | undefined => {
    const accounts: Account[] = Object.values(state.account.accounts)
    const givenAddress = address.toLowerCase()

    return accounts.find(acc => {
      return (
        acc.addressC.toLowerCase() === givenAddress ||
        acc.addressBTC.toLowerCase() === givenAddress ||
        acc.addressAVM?.toLowerCase() === givenAddress ||
        acc.addressPVM?.toLowerCase() === givenAddress ||
        acc?.addressSVM?.toLowerCase() === givenAddress
      )
    })
  }

// Like selectAccountByAddress, but the result is guaranteed to belong to
// `walletId` — so the displayed address can't diverge from the signer.
export const selectAccountByAddressAndWalletId =
  (walletId: string, address: string) =>
  (state: RootState): Account | undefined => {
    const givenAddress = address.toLowerCase()

    return Object.values(state.account.accounts).find(acc => {
      if (acc.walletId !== walletId) return false
      return (
        acc.addressC.toLowerCase() === givenAddress ||
        acc.addressBTC.toLowerCase() === givenAddress ||
        acc.addressAVM?.toLowerCase() === givenAddress ||
        acc.addressPVM?.toLowerCase() === givenAddress ||
        // SVM addresses are base58 and case-sensitive — compare exactly so two
        // distinct pubkeys differing only by case can't be conflated.
        acc.addressSVM === address
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
    return Object.values(accounts)
      .filter(account => account.walletId === walletId)
      .sort((a, b) => a.index - b.index)
  }
)

export const selectLedgerAddressesByWalletId = createSelector(
  [
    selectLedgerAddresses,
    (_: RootState, walletId: string) => walletId,
    selectIsLedgerSupportBlocked
  ],
  (accounts, walletId, isLedgerBlocked) => {
    if (isLedgerBlocked) return []

    return Object.values(accounts)
      .filter(account => account.walletId === walletId)
      .sort((a, b) => a.index - b.index)
  }
)

export const selectAccountByIndex =
  (walletId: string, index: number) =>
  (state: RootState): Account | undefined => {
    const accounts = Object.values(state.account.accounts).filter(
      account => account.walletId === walletId
    )
    const primaryAccount = accounts.find(
      (account): account is PrimaryAccount =>
        'index' in account && account.index === index
    )
    return primaryAccount || accounts[0]
  }

// Memoized selectors to avoid repeated Object.values operations
export const selectAccountsArray = createSelector(
  [selectAccounts],
  (accounts): Account[] => Object.values(accounts)
)

export const selectImportedAccounts = createSelector(
  [selectAccountsArray],
  (accounts): Account[] =>
    accounts.filter(account => account.type === CoreAccountType.IMPORTED)
)

export const selectAccountsCount = createSelector(
  [selectAccounts],
  (accounts): number => Object.keys(accounts).length
)

export const selectActiveAccountHasSolanaAddress = createSelector(
  [selectActiveAccount, selectIsSolanaSupportBlocked],
  (activeAccount, isSolanaSupportBlocked) => {
    if (isSolanaSupportBlocked) return false
    return (
      activeAccount?.addressSVM !== undefined &&
      activeAccount.addressSVM.length > 0
    )
  }
)

// actions
export const {
  setAccountTitle,
  setActiveAccountId,
  setAccount,
  setLedgerAddresses,
  setAccounts,
  setNonActiveAccounts,
  removeAccount,
  removeLedgerAddress
} = accountsSlice.actions

export const accountsReducer = accountsSlice.reducer
