import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork, selectIsTestnet } from 'store/network'
import AccountsService from 'services/account/AccountsService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  Balance,
  Balances,
  BalanceState,
  QueryStatus,
  TokenWithBalance
} from './types'

const reducerName = 'balance'

const initialState: BalanceState = {
  status: QueryStatus.IDLE,
  balances: {}
}

const updateBalanceForKey = (
  state: BalanceState,
  key: string,
  balance: Balance
) => {
  state.balances[key] = balance
}

export const getKey = (chainId: number, address: string) =>
  `${chainId}-${address}`

export const balanceSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setStatus: (state, action: PayloadAction<QueryStatus>) => {
      state.status = action.payload
    },
    setBalances: (state, action: PayloadAction<Balances>) => {
      for (const [key, balance] of Object.entries(action.payload)) {
        updateBalanceForKey(state, key, balance)
      }
    },
    setBalance: (
      state,
      action: PayloadAction<{
        address: string
        accountIndex: number
        chainId: number
        tokens: TokenWithBalance[]
      }>
    ) => {
      const { address, accountIndex, chainId, tokens } = action.payload
      const key = getKey(chainId, address)
      const balance = {
        accountIndex,
        chainId,
        tokens
      }
      updateBalanceForKey(state, key, balance)
    }
  }
})

// selectors
export const selectBalanceStatus = (state: RootState) => state.balance.status

export const selectIsLoadingBalances = (state: RootState) =>
  state.balance.status === QueryStatus.LOADING

export const selectIsRefetchingBalances = (state: RootState) =>
  state.balance.status === QueryStatus.REFETCHING

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const selectTokensWithBalance = (state: RootState) => {
  const network = selectActiveNetwork(state)
  const activeAccount = selectActiveAccount(state)

  if (!activeAccount) return []

  const address = AccountsService.getAddressForNetwork(activeAccount, network)

  const key = getKey(network.chainId, address)
  return state.balance.balances[key]?.tokens ?? []
}

export const selectTokenById = (tokenId: string) => (state: RootState) => {
  const balances = Object.values(state.balance.balances)

  for (const balance of balances) {
    for (const token of balance.tokens) {
      if (token.id === tokenId) return token
    }
  }

  return undefined
}

export const selectBalanceTotalInCurrencyForAccount =
  (accountIndex: number) => (state: RootState) => {
    const isDeveloperMode = selectIsDeveloperMode(state)

    const balances = Object.values(state.balance.balances).filter(
      balance => balance.accountIndex === accountIndex
    )

    let totalInCurrency = 0

    for (const balance of balances) {
      const isTestnet = selectIsTestnet(balance.chainId)(state)

      // when developer mode is on, only add testnet balances
      // when developer mode is off, only add mainnet balances
      if ((isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)) {
        for (const token of balance.tokens) {
          totalInCurrency += token.balanceInCurrency ?? 0
        }
      }
    }

    return totalInCurrency
  }

export const selectBalanceTotalInCurrencyForNetwork =
  (chainId: number) => (state: RootState) => {
    const balances = Object.values(state.balance.balances).filter(
      balance => balance.chainId === chainId
    )

    let totalInCurrency = 0

    for (const balance of balances) {
      for (const token of balance.tokens) {
        totalInCurrency += token.balanceInCurrency ?? 0
      }
    }

    return totalInCurrency
  }

// actions
export const { setStatus, setBalances, setBalance } = balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const balanceReducer = balanceSlice.reducer
