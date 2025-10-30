import {
  createAction,
  createSelector,
  createSlice,
  PayloadAction
} from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import {
  Account,
  selectAccountsByWalletId,
  selectActiveAccount,
  selectPlatformAccountsByWalletId
} from 'store/account'
import {
  selectAllNetworks,
  selectEnabledChainIds,
  selectNetworks,
  XpNetworkVMType
} from 'store/network'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { NetworkVMType, TokenType } from '@avalabs/vm-module-types'
import {
  isTokenWithBalanceAVM,
  isTokenWithBalancePVM
} from '@avalabs/avalanche-module'
import { TokenVisibility } from 'store/portfolio'
import { Wallet } from 'store/wallet/types'
import { isPlatformAccount } from 'store/account/utils'
import {
  Balance,
  Balances,
  BalanceState,
  LocalTokenWithBalance,
  QueryStatus
} from './types'
import { isTokenVisible } from './utils'
import { QueryType } from './types'

const reducerName = 'balance'

const initialState: BalanceState = {
  status: {
    [QueryType.ALL]: QueryStatus.IDLE,
    [QueryType.XP]: QueryStatus.IDLE
  },
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
    setStatus: (
      state,
      action: PayloadAction<{ status: QueryStatus; queryType: QueryType }>
    ) => {
      state.status = {
        ...state.status,
        [action.payload.queryType]: action.payload.status
      }
    },
    setBalances: (state, action: PayloadAction<Balances>) => {
      for (const [key, balance] of Object.entries(action.payload)) {
        updateBalanceForKey(state, key, balance)
      }
    }
  }
})

// selectors
export const selectAllBalanceStatus = (state: RootState): QueryStatus =>
  state.balance.status[QueryType.ALL]

export const selectXpBalanceStatus = (state: RootState): QueryStatus =>
  state.balance.status[QueryType.XP]

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

export const selectIsXpBalanceLoadedForWallet =
  (walletId: string, networkType: XpNetworkVMType) => (state: RootState) => {
    const key = Object.keys(state.balance.balances).find(
      k => k.includes(walletId) && k.includes(networkType)
    )
    return key !== undefined && !!state.balance.balances[key]
  }

export const selectIsPollingAccountBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.ALL] === QueryStatus.POLLING

export const selectIsPollingXpBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.XP] === QueryStatus.POLLING

export const selectIsPollingBalances = createSelector(
  [selectIsPollingAccountBalances, selectIsPollingXpBalances],
  (isPollingAccountBalances, isPollingXpBalances) =>
    isPollingAccountBalances || isPollingXpBalances
)

export const selectIsLoadingAccountBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.ALL] === QueryStatus.LOADING

export const selectIsLoadingXpBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.XP] === QueryStatus.LOADING

export const selectIsLoadingBalances = createSelector(
  [selectIsLoadingAccountBalances, selectIsLoadingXpBalances],
  (isLoadingAccountBalances, isLoadingXpBalances) =>
    isLoadingAccountBalances || isLoadingXpBalances
)

export const selectIsRefetchingAccountBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.ALL] === QueryStatus.REFETCHING

export const selectIsRefetchingXpBalances = (state: RootState): boolean =>
  state.balance.status[QueryType.XP] === QueryStatus.REFETCHING

export const selectIsRefetchingBalances = createSelector(
  [selectIsRefetchingAccountBalances, selectIsRefetchingXpBalances],
  (isRefetchingAccountBalances, isRefetchingXpBalances) =>
    isRefetchingAccountBalances || isRefetchingXpBalances
)

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

export const selectTokensByNetwork = (
  tokenVisibility: TokenVisibility,
  chainId?: number
): ((state: RootState) => {
  enabledTokens: string[]
  disabledTokens: string[]
}) =>
  createSelector(
    [selectActiveAccount, _selectAllBalances],
    (
      activeAccount,
      balances
    ): {
      enabledTokens: string[]
      disabledTokens: string[]
    } => {
      if (!chainId) return { enabledTokens: [], disabledTokens: [] }
      if (!activeAccount) return { enabledTokens: [], disabledTokens: [] }

      const balanceKey = getKey(chainId, activeAccount.id)
      const tokens = balances[balanceKey]?.tokens ?? []

      const enabled: string[] = []
      const disabled: string[] = []
      tokens.forEach(token => {
        if (isTokenVisible(tokenVisibility, token)) {
          'chainId' in token && enabled.push(token.address)
        } else {
          'chainId' in token && disabled.push(token.address)
        }
      })
      return { enabledTokens: enabled, disabledTokens: disabled }
    }
  )

export const selectTokensWithZeroBalanceByNetworks = (
  chainIds: number[]
): ((state: RootState) => LocalTokenWithBalance[]) =>
  createSelector(
    [selectActiveAccount, _selectAllBalances],
    (activeAccount, allBalances): LocalTokenWithBalance[] => {
      if (!activeAccount || chainIds.length === 0) return []

      const tokensWithZeroBalance: LocalTokenWithBalance[] = []
      for (const chainId of chainIds) {
        const key = getKey(chainId, activeAccount.id)
        const tokens = allBalances[key]?.tokens ?? []
        tokensWithZeroBalance.push(
          ...tokens.filter(token => token.balance === 0n)
        )
      }

      return tokensWithZeroBalance
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

const _selectBalancesByXpNetwork =
  (walletId: string, xpNetworkType: XpNetworkVMType) => (state: RootState) => {
    const balances = _selectAllBalances(state)

    const matchingKeys = Object.keys(balances).filter(
      key => key.includes(walletId) && key.includes(xpNetworkType)
    )

    return matchingKeys
      .map(key => balances[key])
      .filter(balance => balance !== undefined)
  }

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
      .reduce((acc, token) => acc + (token.balance ?? 0n), 0n)
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
      .reduce((acc, token) => acc + (token.balanceInCurrency ?? 0), 0)
  }

export const selectTokensWithXpBalanceForWallet =
  (walletId: string, networkType: XpNetworkVMType) => (state: RootState) => {
    const balances = _selectAllBalances(state)
    const matchingKeys = Object.keys(balances).filter(
      key => key.includes(walletId) && key.includes(networkType)
    )
    const balancesToSum: Balance[] = []
    for (const key of matchingKeys) {
      balances[key] && balancesToSum.push(balances[key])
    }
    return balancesToSum
  }

export const selectXPBalanceTotalByWallet =
  (walletId: string, networkType: XpNetworkVMType) => (state: RootState) => {
    const balances = selectTokensWithXpBalanceForWallet(
      walletId,
      networkType
    )(state)

    if (balances.length === 0) {
      return 0n
    }

    return balances.reduce(
      (acc, balance) =>
        acc +
        balance.tokens.reduce((a, token) => a + (token.balance ?? 0n), 0n),
      0n
    )
  }

export const selectBalanceTotalInCurrencyForXpNetwork =
  (walletId: string, networkType: XpNetworkVMType) => (state: RootState) => {
    const balances = selectTokensWithXpBalanceForWallet(
      walletId,
      networkType
    )(state)

    if (balances.length === 0) {
      return 0
    }

    return balances.reduce(
      (acc, balance) =>
        acc +
        balance.tokens.reduce(
          (a, token) => a + (token.balanceInCurrency ?? 0),
          0
        ),
      0
    )
  }

export const selectBalanceTotalInCurrencyForWallet =
  (walletId: string, tokenVisibility: TokenVisibility) =>
  (state: RootState) => {
    const accounts = selectAccountsByWalletId(state, walletId)
    const platformAccounts = selectPlatformAccountsByWalletId(state, walletId)

    return [...accounts, ...platformAccounts].reduce((acc, account) => {
      if (isPlatformAccount(account.id)) {
        const balance = selectBalanceTotalInCurrencyForXpNetwork(
          walletId,
          account.id === NetworkVMType.AVM
            ? NetworkVMType.AVM
            : NetworkVMType.PVM
        )(state)
        return acc + balance
      }
      const balance = selectBalanceTotalInCurrencyForAccount(
        account.id,
        tokenVisibility
      )(state)
      return acc + balance
    }, 0)
  }

export const selectBalanceForAccountIsAccurate =
  (accountId: string) => (state: RootState) => {
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
    if (tokens.length === 0) return false

    return !Object.values(state.balance.balances)
      .filter(balance => balance.accountId === accountId)
      .some(balance => !balance.dataAccurate)
  }

export const selectXpBalanceForAccountIsAccurate =
  (walletId: string, xpNetworkType: XpNetworkVMType) => (state: RootState) => {
    const tokens = _selectBalancesByXpNetwork(walletId, xpNetworkType)(state)
    if (tokens.length === 0) return false
    return !tokens.some(balance => !balance.dataAccurate)
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
    if (!accountId) return
    const tokens = selectTokensWithBalanceForAccount(state, accountId)
    return (
      tokens.length === 0 &&
      Object.values(state.balance.balances).every(
        balance => balance.dataAccurate === false
      )
    )
  }

export const selectIsAllBalancesError = (
  state: RootState
): boolean | undefined => {
  if (Object.values(state.balance.balances).length === 0) return
  return Object.values(state.balance.balances).every(balance => balance.error)
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

export const fetchBalanceForAccount = createAction<{ account: Account }>(
  `${reducerName}/fetchBalanceForAccount`
)

export const fetchXpBalancesForWallet = createAction<{ wallet: Wallet }>(
  `${reducerName}/fetchXpBalancesForWallet`
)

export const balanceReducer = balanceSlice.reducer
