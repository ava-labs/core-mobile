import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import BN from 'bn.js'
import { selectActiveNetwork } from 'store/network'
import { Network } from '@avalabs/chains-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import {
  Balance,
  Balances,
  BalanceState,
  LocalTokenWithBalance,
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
): void => {
  state.balances[key] = balance
}

export const getKey = (chainId: number, accountIndex: number): string =>
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
export const selectBalanceStatus = (state: RootState): QueryStatus =>
  state.balance.status

export const selectIsBalanceLoadedForAddress =
  (accountIndex: number, chainId: number) => (state: RootState) => {
    return !!state.balance.balances[getKey(chainId, accountIndex)]
  }

export const selectIsLoadingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.LOADING

export const selectIsRefetchingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.REFETCHING

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const selectTokensWithBalance = (
  state: RootState
): LocalTokenWithBalance[] => {
  const activeNetwork = selectActiveNetwork(state)
  const activeAccount = selectActiveAccount(state)

  if (!activeAccount) return []

  const key = getKey(activeNetwork.chainId, activeAccount.index)
  return state.balance.balances[key]?.tokens ?? []
}

export const selectTokensWithBalanceByNetwork =
  (network?: Network) =>
  (state: RootState): LocalTokenWithBalance[] => {
    const activeAccount = selectActiveAccount(state)

    if (!network) return []
    if (!activeAccount) return []

    const key = getKey(network.chainId, activeAccount.index)
    return state.balance.balances[key]?.tokens ?? []
  }

export const selectTokensWithZeroBalance = (
  state: RootState
): LocalTokenWithBalance[] => {
  const allTokens = selectTokensWithBalance(state)
  return allTokens.filter(t => t.balance.eq(BN_ZERO))
}

export const selectAvaxPrice = (state: RootState): number => {
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

export const selectBalancesForAccount =
  (accountIndex: number) => (state: RootState) => {
    return Object.values(state.balance.balances).filter(
      balance => balance.accountIndex === accountIndex
    )
  }

export const selectTokensWithBalanceForAccount =
  (accountIndex: number | undefined) => (state: RootState) => {
    if (accountIndex === undefined) return []

    const balances = selectBalancesForAccount(accountIndex)(state)
    return balances.flatMap(b => b.tokens)
  }

export const selectBalanceTotalInCurrencyForNetwork =
  (accountIndex: number) => (state: RootState) => {
    const balances = selectBalancesForAccount(accountIndex)(state)

    const isDeveloperMode = selectIsDeveloperMode(state)

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

const _selectAllBalances = (state: RootState): Balances =>
  state.balance.balances

const _selectBalanceKeyForNetworkAndAccount = (
  _state: RootState,
  chainId: number,
  accountIndex: number | undefined
): string | undefined => {
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

// actions
export const { setStatus, setBalances } = balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const fetchBalanceForAccount = createAction<{ accountIndex: number }>(
  `${reducerName}/fetchBalanceForAccount`
)
export const balanceReducer = balanceSlice.reducer
