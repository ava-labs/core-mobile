import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { selectActiveAccount } from 'store/account'
import {
  selectAllNetworks,
  selectEnabledChainIds,
  selectNetworks
} from 'store/network'
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

export const getKey = (chainId: number, accountId: string): string =>
  `${chainId}-${accountId}`

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
  (accountId: string) => (state: RootState) => {
    const networks = selectNetworks(state)
    const foundBalance = Object.values(state.balance.balances).find(balance => {
      const network = networks[balance.chainId]
      return (
        balance.accountId === accountId && network?.chainId === balance.chainId
      )
    })

    return !!foundBalance
  }

export const selectIsLoadingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.LOADING

export const selectIsRefetchingBalances = (state: RootState): boolean =>
  state.balance.status === QueryStatus.REFETCHING

const _selectAllBalances = (state: RootState): Balances => {
  return state.balance.balances
}

export const selectTokensWithBalanceByNetwork = (
  chainId?: number
): ((state: RootState) => LocalTokenWithBalance[]) =>
  createSelector(
    [selectActiveAccount, _selectAllBalances],
    (activeAccount, balances): LocalTokenWithBalance[] => {
      if (!chainId) return []
      if (!activeAccount) return []

      const balanceKey = getKey(chainId, activeAccount.id)
      return balances[balanceKey]?.tokens ?? []
    }
  )

export const selectTokensWithZeroBalanceByNetwork = (
  chainId?: number
): ((state: RootState) => LocalTokenWithBalance[]) =>
  createSelector(
    [selectActiveAccount, _selectAllBalances],
    (activeAccount, allBalances): LocalTokenWithBalance[] => {
      if (!activeAccount || !chainId) return []

      const key = getKey(chainId, activeAccount.id)
      const tokens = allBalances[key]?.tokens ?? []
      return tokens.filter(token => token.balance === 0n)
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

const _selectAccountId = (
  _: RootState,
  accountId: string | undefined
): string | undefined => accountId

const _selectBalancesByAccountId = createSelector(
  [_selectAllBalances, _selectAccountId],
  (balances, accountId) => {
    if (accountId === undefined) return []

    // Filter balances based on accountId and other conditions
    return Object.values(balances).filter(
      balance => balance.accountId === accountId
    )
  }
)

export const selectTokensWithBalanceForAccount = createSelector(
  [selectIsDeveloperMode, selectAllNetworks, _selectBalancesByAccountId],
  (isDeveloperMode, networks, balancesByAccountId) => {
    const filteredBalancesForCurrentMode = balancesByAccountId.filter(
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

export const selectBalanceTotalForAccount =
  (accountId: string, tokenVisibility: TokenVisibility) =>
  (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
    const enabledChainIds = selectEnabledChainIds(state)

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((total, token) => {
        total += token.balance ?? 0n
        return total
      }, 0n)
  }

export const selectBalanceTotalInCurrencyForAccount =
  (accountId: string, tokenVisibility: TokenVisibility) =>
  (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
    const enabledChainIds = selectEnabledChainIds(state)

    return tokens
      .filter(
        token =>
          isTokenVisible(tokenVisibility, token) &&
          enabledChainIds.includes(token.networkChainId)
      )
      .reduce((total, token) => {
        total += token.balanceInCurrency ?? 0
        return total
      }, 0)
  }

export const selectBalanceForAccountIsAccurate =
  (accountId: string) => (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
    if (tokens.length === 0) return false
    return !Object.values(state.balance.balances).some(
      balance => !balance.dataAccurate
    )
  }

const _selectBalanceKeyForNetworkAndAccount = (
  _state: RootState,
  chainId: number | undefined,
  accountId: string | undefined
): string | undefined => {
  if (accountId === undefined || chainId === undefined) return undefined

  return getKey(chainId, accountId)
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

export const selectTokensWithBalanceForAccountAndNetwork = createSelector(
  [_selectAllBalances, _selectBalanceKeyForNetworkAndAccount],
  (allBalances, key): LocalTokenWithBalance[] => {
    if (key === undefined) return []

    return allBalances[key]?.tokens ?? []
  }
)

// use in k2-alpine
export const selectIsAllBalancesInaccurate =
  (accountId: string | undefined) => (state: RootState) => {
    if (!accountId) return false
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
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

    const key = getKey(chainId, activeAccount.id)
    return state.balance.balances[key]?.dataAccurate ?? false
  }

// actions
export const { setStatus, setBalances } = balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const fetchBalanceForAccount = createAction<{ accountId: string }>(
  `${reducerName}/fetchBalanceForAccount`
)
export const balanceReducer = balanceSlice.reducer
