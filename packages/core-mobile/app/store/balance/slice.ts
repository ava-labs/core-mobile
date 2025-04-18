import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import { selectActiveNetwork, selectAllNetworks } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { TokenType } from '@avalabs/vm-module-types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenVisibility } from 'store/portfolio'
import {
  Balance,
  Balances,
  BalanceState,
  LocalTokenWithBalance,
  QueryStatus
} from './types'
import { isTokenVisible } from './utils'

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

export const selectIsBalanceLoadedForAccount =
  (accountIndex: number) => (state: RootState) => {
    const foundBalance = Object.values(state.balance.balances).find(balance => {
      return balance.accountIndex === accountIndex
    })

    return !!foundBalance
  }

export const selectIsBalanceLoadedForActiveNetwork = (
  state: RootState
): boolean => {
  const activeNetwork = selectActiveNetwork(state)
  const activeAccount = selectActiveAccount(state)

  if (!activeAccount) return false

  return !!state.balance.balances[
    getKey(activeNetwork.chainId, activeAccount.index)
  ]
}

export const selectIsBalanceLoadedForNetworks =
  (chainIds: number[]) =>
  (state: RootState): boolean => {
    const activeAccount = selectActiveAccount(state)

    if (!activeAccount) return false

    return chainIds.every(chainId => {
      return !!state.balance.balances[getKey(chainId, activeAccount.index)]
    })
  }

export const selectIsLoadingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.LOADING

export const selectIsRefetchingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.REFETCHING

const _selectAllBalances = (state: RootState): Balances => {
  return state.balance.balances
}

// get the list of tokens for the active network
// each token will have info such as: balance, price, market cap,...
export const selectTokensWithBalance = createSelector(
  [selectActiveNetwork, selectActiveAccount, _selectAllBalances],
  (activeNetwork, activeAccount, allBalances): LocalTokenWithBalance[] => {
    if (!activeAccount) return []

    const key = getKey(activeNetwork.chainId, activeAccount.index)
    return allBalances[key]?.tokens ?? []
  }
)

export const selectTokensWithBalanceByNetwork =
  (network?: Network) =>
  (state: RootState): LocalTokenWithBalance[] => {
    const activeAccount = selectActiveAccount(state)

    if (!network) return []
    if (!activeAccount) return []

    const key = getKey(network.chainId, activeAccount.index)
    return state.balance.balances[key]?.tokens ?? []
  }

export const selectTokensWithZeroBalance = createSelector(
  selectTokensWithBalance,
  (allTokens: LocalTokenWithBalance[]): LocalTokenWithBalance[] => {
    return allTokens.filter(t => t.balance === 0n)
  }
)

export const selectAvaxPrice = (state: RootState): number => {
  const balances = Object.values(state.balance.balances)

  for (const balance of balances) {
    for (const token of balance.tokens) {
      if (
        'type' in token &&
        'symbol' in token &&
        token.type === TokenType.NATIVE &&
        token.symbol.toLowerCase() === 'avax' &&
        token.priceInCurrency
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

const _selectAccountIndex = (
  _: RootState,
  accountIndex: number | undefined
): number | undefined => accountIndex

const _selectBalancesByAccountIndex = createSelector(
  [_selectAllBalances, _selectAccountIndex],
  (balances, accountIndex) => {
    if (accountIndex === undefined) return []

    // Filter balances based on accountIndex and other conditions
    return Object.values(balances).filter(
      balance => balance.accountIndex === accountIndex
    )
  }
)

export const selectTokensWithBalanceForAccount = createSelector(
  [selectIsDeveloperMode, selectAllNetworks, _selectBalancesByAccountIndex],
  (isDeveloperMode, networks, balancesByAccountIndex) => {
    const filteredBalancesForCurrentMode = balancesByAccountIndex.filter(
      balance => {
        const isTestnet = networks[balance.chainId]?.isTestnet
        return (
          (isDeveloperMode && isTestnet) || (!isDeveloperMode && !isTestnet)
        )
      }
    )

    // Return the tokens for filtered balances
    return filteredBalancesForCurrentMode.flatMap(b => b.tokens)
  }
)

export const selectBalanceTotalInCurrencyForAccount =
  (accountIndex: number, tokenVisibility: TokenVisibility) =>
  (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountIndex)

    return tokens
      .filter(token => isTokenVisible(tokenVisibility, token))
      .reduce((total, token) => {
        total += token.balanceInCurrency ?? 0
        return total
      }, 0)
  }

export const selectBalanceForAccountIsAccurate =
  (accountIndex: number) => (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountIndex)
    if (tokens.length === 0) return false
    return !Object.values(state.balance.balances).some(
      balance => !balance.dataAccurate
    )
  }

export const selectBalanceTotalInCurrencyForNetworkAndAccount =
  (
    chainId: number,
    accountIndex: number | undefined,
    tokenVisibility: TokenVisibility
  ) =>
  (state: RootState) => {
    if (accountIndex === undefined) return 0

    const balances = Object.values(state.balance.balances).filter(
      balance =>
        balance.chainId === chainId && balance.accountIndex === accountIndex
    )

    let totalInCurrency = 0

    for (const balance of balances) {
      for (const token of balance.tokens) {
        if (!isTokenVisible(tokenVisibility, token)) continue
        totalInCurrency += token.balanceInCurrency ?? 0
      }
    }

    return totalInCurrency
  }

const _selectBalanceKeyForNetworkAndAccount = (
  _state: RootState,
  chainId: number | undefined,
  accountIndex: number | undefined
): string | undefined => {
  if (accountIndex === undefined || chainId === undefined) return undefined

  return getKey(chainId, accountIndex)
}

export const selectAvailableNativeTokenBalanceForNetworkAndAccount =
  createSelector(
    [_selectAllBalances, _selectBalanceKeyForNetworkAndAccount],
    (allBalances, key): bigint => {
      if (key === undefined) return 0n

      const balanceForNetworkAndAccount = allBalances[key]

      const nativeToken = Object.values(
        balanceForNetworkAndAccount?.tokens ?? []
      )?.find(token => {
        return token.type === TokenType.NATIVE
      })

      if (
        nativeToken &&
        (isTokenWithBalancePVM(nativeToken) ||
          isTokenWithBalanceAVM(nativeToken))
      ) {
        return nativeToken.available ?? 0n
      }
      return nativeToken?.balance ?? 0n
    }
  )

// use in k2-alpine
export const selectIsAllBalancesInaccurate =
  (accountIndex: number) => (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountIndex)
    return (
      tokens.length === 0 &&
      Object.values(state.balance.balances).every(
        balance => balance.dataAccurate === false
      )
    )
  }

export const selectIsBalancesAccurateByNetwork =
  (chainId?: number) =>
  (state: RootState): boolean => {
    const activeAccount = selectActiveAccount(state)

    if (!chainId) return false
    if (!activeAccount) return false

    const key = getKey(chainId, activeAccount.index)
    return state.balance.balances[key]?.dataAccurate ?? false
  }

// actions
export const { setStatus, setBalances } = balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const fetchBalanceForAccount = createAction<{ accountIndex: number }>(
  `${reducerName}/fetchBalanceForAccount`
)
export const balanceReducer = balanceSlice.reducer
