import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TokenWithBalance } from '@avalabs/wallet-react-components'
import { AppStartListening } from 'store/middleware/listener'
import BalanceService from 'services/balance/BalanceService'
import { Network } from 'store/network'
import { BalanceState } from './types'

const reducerName = 'balance'

const initialState: BalanceState = {
  balances: {}
}

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
      state.balances[address] = {
        accountIndex,
        chainId,
        tokens
      }
    }
  }
})

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
  // TODO remove this after we switch to new balance fetch logic (for all accounts)
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

// types
export * from './types'

export default balanceSlice.reducer
