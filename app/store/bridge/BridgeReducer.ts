import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { BridgeState, initialState } from 'store/bridge/BridgeState'
import { BridgeTransaction } from '@avalabs/bridge-sdk'

const reducerName = 'bridge'

export const bridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addBridgeTransaction: (state, action: PayloadAction<BridgeTransaction>) => {
      const bridgeTx = action.payload
      const currentBridgeState = state.bridge

      state.bridge = {
        ...currentBridgeState,
        bridgeTransactions: {
          ...currentBridgeState.bridgeTransactions,
          [bridgeTx.sourceTxHash]: bridgeTx
        }
      }
    },
    popBridgeTransaction: (state, action: PayloadAction<string>) => {
      const sourceTxHash = action.payload
      const { [sourceTxHash]: unused, ...rest } =
        state.bridge.bridgeTransactions

      state.bridge = {
        ...state.bridge,
        bridgeTransactions: rest
      }
    },
    setBridgeFilter(state, action: PayloadAction<boolean>) {
      state.bridge.isMainnet = action.payload
    }
  }
})

export const selectBridge = (state: RootState) => state.bridge.bridge
export const selectBridgeTransactions = (state: RootState) => {
  return Object.values(state.bridge.bridge.bridgeTransactions).reduce<
    BridgeState['bridgeTransactions']
  >((txs, btx) => {
    // go figure
    const bridgeTx = btx as BridgeTransaction
    if (
      bridgeTx.environment === (state.bridge.bridge.isMainnet ? 'main' : 'test')
    ) {
      txs[bridgeTx.sourceTxHash] = bridgeTx
    }
    return txs
  }, {})
}

export const { addBridgeTransaction, popBridgeTransaction, setBridgeFilter } =
  bridgeSlice.actions

export default bridgeSlice.reducer
