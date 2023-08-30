import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { AppStartListening } from 'store/middleware/listener'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import { selectActiveNetwork } from 'store/network'
import { NetworkFee } from 'services/networkFee/types'
import { NetworkFeeState } from 'store/networkFee/types'

const reducerName = 'networkFee'

const initialState = {
  networkFee: {
    low: 0n,
    medium: 0n,
    high: 0n,
    displayDecimals: 0,
    nativeTokenDecimals: 0,
    unit: '',
    isFixedFee: false,
    nativeTokenSymbol: ''
  } as NetworkFee
} as NetworkFeeState

const networkFeeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    updateNetworkFee: (state, action: PayloadAction<NetworkFee>) => {
      state.networkFee = action.payload
    }
  }
})

// selectors
export const selectNetworkFee = (state: RootState) =>
  state.networkFee.networkFee

// actions
export const fetchNetworkFee = createAction(`${reducerName}/fetchNetworkFee`)
export const { updateNetworkFee } = networkFeeSlice.actions

// listeners
export const addNetworkFeeListeners = (startListening: AppStartListening) => {
  // todo: pool every 30 seconds
  startListening({
    actionCreator: fetchNetworkFee,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()
      const activeNetwork = selectActiveNetwork(state)
      const fees = await networkFeeService.getNetworkFee(activeNetwork)
      listenerApi.dispatch(
        updateNetworkFee(fees ? fees : initialState.networkFee)
      )
    }
  })
}

// types
export * from './types'

export default networkFeeSlice.reducer
