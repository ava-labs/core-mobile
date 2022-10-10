import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { selectActiveAccount } from 'store/account'
import { ChainID, selectActiveNetwork, selectIsTestnet } from 'store/network'
import AccountsService from 'services/account/AccountsService'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import BN from 'bn.js'
import { Network, NetworkContractToken } from '@avalabs/chains-sdk'
import { getLocalTokenId } from 'store/balance/utils'
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
  balances: {},
  allTokens: {}
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
        tokens: LocalTokenWithBalance[]
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
    },
    setAllTokens: (
      state,
      action: PayloadAction<{
        allNetworksWithTokens: Record<ChainID, Network>
      }>
    ) => {
      const { allNetworksWithTokens } = action.payload

      const allTokens: Record<ChainID, NetworkContractToken[]> = {}
      Object.entries(allNetworksWithTokens).forEach(([chainId, network]) => {
        allTokens[Number(chainId)] = network.tokens ?? []
      })
      state.allTokens = allTokens
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

export const selectTokensWithBalanceByNetwork =
  (network: Network) => (state: RootState) => {
    const activeAccount = selectActiveAccount(state)

    if (!activeAccount) return []

    const address = AccountsService.getAddressForNetwork(activeAccount, network)

    const key = getKey(network.chainId, address)
    return state.balance.balances[key]?.tokens ?? []
  }

export const selectAllNetworkTokensAsLocal =
  (chainId: ChainID) =>
  (state: RootState): LocalTokenWithBalance[] => {
    return (
      state.balance.allTokens[chainId]?.map(token => {
        return {
          ...token,
          localId: getLocalTokenId(token),
          balance: new BN(0),
          balanceInCurrency: 0,
          balanceDisplayValue: '0',
          balanceCurrencyDisplayValue: '0',
          priceInCurrency: 0,
          marketCap: 0,
          change24: 0,
          vol24: 0
        } as LocalTokenWithBalance
      }) ?? []
    )
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
export const { setStatus, setBalances, setBalance, setAllTokens } =
  balanceSlice.actions

export const refetchBalance = createAction(`${reducerName}/refetchBalance`)

export const balanceReducer = balanceSlice.reducer
