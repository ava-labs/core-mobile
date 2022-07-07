import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store/index'
import { AppStartListening } from 'store/middleware/listener'
import { BigNumber } from 'ethers'
import networkFeeService from 'services/networkFee/NetworkFeeService'
import { selectActiveNetwork } from 'store/network'
import { NetworkFee } from 'services/networkFee/types'
import { NetworkFeeState } from 'store/networkFee/types'
import { onAppUnlocked } from 'store/app'

const reducerName = 'networkFee'

const initialState = {
  networkFees: {
    low: BigNumber.from(0),
    medium: BigNumber.from(0),
    high: BigNumber.from(0),
    displayDecimals: 0,
    isFixedFee: false
  }
} as NetworkFeeState

const networkFeeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    updateNetworkFee: (state, action: PayloadAction<NetworkFee>) => {
      state.networkFees = action.payload
    }
  }
})

// selectors
export const selectNetworkFee = (state: RootState) => state.networkFee

// actions
export const fetchNetworkFee = createAction(`${reducerName}/fetchNetworkFee`)
export const { updateNetworkFee } = networkFeeSlice.actions

// listeners
export const addNetworkFeeListeners = (startListening: AppStartListening) => {
  // todo: pool every 30 seconds
  startListening({
    actionCreator: onAppUnlocked,
    effect: async (action, listenerApi) => {
      const state = listenerApi.getState()
      const activeNetwork = selectActiveNetwork(state)
      const fees = await networkFeeService.getNetworkFee(activeNetwork)
      listenerApi.dispatch(
        updateNetworkFee(fees ? fees : initialState.networkFees)
      )
    }
  })
}

export default networkFeeSlice.reducer
