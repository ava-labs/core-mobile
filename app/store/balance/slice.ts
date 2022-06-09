import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { AppStartListening } from 'store/middleware/listener'
import { RootState } from 'store'
import { Network } from '@avalabs/chains-sdk'
import BalanceService from 'services/balance/BalanceService'
import { BalanceState, TokenWithBalance } from './types'

const reducerName = 'balance'

const initialState: BalanceState = {
  balances: {}
}

const getKey = (chainId: number, address: string) => `${chainId}-${address}`

export const balanceSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
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
      state.balances[key] = {
        accountIndex,
        chainId,
        tokens
      }
    }
  }
})

// selectors
// TODO CP-2114 remove chainId and address params once we have accounts reducer
// we can infer chainId from active network and address from accounts reducer
export const selectTokensWithBalance =
  (chainId: number, address: string) => (state: RootState) => {
    const key = getKey(chainId, address)
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

export const selectBalanceTotalInUSD =
  (accountIndex: number) => (state: RootState) => {
    const balances = Object.values(state.balance.balances).filter(
      balance => balance.accountIndex === accountIndex
    )

    let totalInUSD = 0

    for (const balance of balances) {
      for (const token of balance.tokens) {
        totalInUSD += token.balanceUSD ?? 0
      }
    }

    return totalInUSD
  }

// actions
export const { setBalance } = balanceSlice.actions

type GetBalanceActionPayload = {
  accountIndex: number
  address: string
  network: Network
}
export const getBalance = createAction<GetBalanceActionPayload>(
  `${reducerName}/getBalance`
)

// listeners
export const addBalanceListeners = (startListening: AppStartListening) => {
  // TODO CP-2114 remove this after we switch to new balance fetch logic (for all accounts)
  startListening({
    actionCreator: getBalance,
    effect: async (action, listenerApi) => {
      const { accountIndex, address, network } = action.payload
      const tokens = await BalanceService.getBalances(network, address)

      listenerApi.dispatch(
        setBalance({
          address,
          accountIndex,
          chainId: network.chainId,
          tokens
        })
      )
    }
  })
}

export const balanceReducer = balanceSlice.reducer
