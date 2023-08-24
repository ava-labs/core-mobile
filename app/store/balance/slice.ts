import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork, selectIsTestnet } from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import BN from 'bn.js'
import { Network } from '@avalabs/chains-sdk'
import {
  Balance,
  Balances,
  BalanceState,
  QueryStatus,
  TokenType
} from './types'

const BN_ZERO = new BN(0)

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

export const getKey = (chainId: number, accountIndex: number) =>
  `${chainId}-${accountIndex}`

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
    }
  }
})

// selectors
export const selectBalanceStatus = (state: RootState) => state.balance.status

export const selectIsBalanceLoadedForAddress =
  (accountIndex: number) => (state: RootState) => {
    const network = selectActiveNetwork(state)
    return !!state.balance.balances[getKey(network.chainId, accountIndex)]
  }

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

  const key = getKey(network.chainId, activeAccount.index)
  return state.balance.balances[key]?.tokens ?? []
}

export const selectTokensWithBalanceByNetwork =
  (network?: Network) => (state: RootState) => {
    const activeAccount = selectActiveAccount(state)

    if (!network) return []
    if (!activeAccount) return []

    const key = getKey(network.chainId, activeAccount.index)
    return state.balance.balances[key]?.tokens ?? []
  }

export const selectTokensWithZeroBalance = (state: RootState) => {
  const allTokens = selectTokensWithBalance(state)
  return allTokens.filter(t => t.balance.eq(BN_ZERO))
}

export const selectAvaxPrice = (state: RootState) => {
  const balances = Object.values(state.balance.balances)

  for (const balance of balances) {
    for (const token of balance.tokens) {
      if (
        'type' in token &&
        'symbol' in token &&
        token.type === TokenType.NATIVE &&
        token.symbol.toLowerCase() === 'avax'
      ) {
        return token.priceInCurrency
      }
    }
  }
  return 0
}

export const selectTokenByAddress = (address: string) => (state: RootState) => {
  const balances = Object.values(state.balance.balances)

  for (const balance of balances) {
    for (const token of balance.tokens) {
      if ('address' in token && token.address === address) return token
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
      if (
        (isDeveloperMode && isTestnet) ||
        (!isDeveloperMode && isTestnet === false)
      ) {
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

export const selectBalanceTotalInCurrencyForNetworkAndAccount =
  (chainId: number, accountIndex: number | undefined) => (state: RootState) => {
    if (accountIndex === undefined) return 0

    const balances = Object.values(state.balance.balances).filter(
      balance =>
        balance.chainId === chainId && balance.accountIndex === accountIndex
    )

    let totalInCurrency = 0

    for (const balance of balances) {
      for (const token of balance.tokens) {
        totalInCurrency += token.balanceInCurrency ?? 0
      }
    }

    return totalInCurrency
  }

const _selectAllBalances = (state: RootState) => state.balance.balances

const _selectBalanceKeyForNetworkAndAccount = (
  _state: RootState,
  chainId: number,
  accountIndex: number | undefined
) => {
  if (accountIndex === undefined) return undefined

  return getKey(chainId, accountIndex)
}

export const selectNativeTokenBalanceForNetworkAndAccount = createSelector(
  [_selectAllBalances, _selectBalanceKeyForNetworkAndAccount],
  (allBalances, key) => {
    if (key === undefined) return BN_ZERO

    const balanceForNetworkAndAccount = allBalances[key]

    const nativeToken = Object.values(
      balanceForNetworkAndAccount?.tokens ?? []
    )?.find(token => token.type === TokenType.NATIVE)

    return nativeToken?.balance ?? BN_ZERO
  }
)

export const selectBalanceTotalForNetwork =
  (chainId: number) => (state: RootState) => {
    const balances = Object.values(state.balance.balances).filter(
      balance => balance.chainId === chainId
    )

    let total = new BN(0)

    for (const balance of balances) {
      for (const token of balance.tokens) {
        total = total.add(token.balance ?? new BN(0))
      }
    }

    return total
  }

// actions
export const { setStatus, setBalances } = balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const fetchBalanceForAccount = createAction<{ accountIndex: number }>(
  `${reducerName}/fetchBalanceForAccount`
)
export const balanceReducer = balanceSlice.reducer
