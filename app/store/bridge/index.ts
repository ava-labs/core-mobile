import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'store'
import { BridgeTransaction } from '@avalabs/bridge-sdk'
import { selectActiveNetwork } from 'store/network'
import { BridgeState, initialState } from 'store/bridge/types'

const reducerName = 'bridge'

export const bridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addBridgeTransaction: (state, action: PayloadAction<BridgeTransaction>) => {
      const bridgeTx = action.payload
      state.bridge.bridgeTransactions[bridgeTx.sourceTxHash] = bridgeTx
    },
    popBridgeTransaction: (state, action: PayloadAction<string>) => {
      const sourceTxHash = action.payload
      delete state.bridge.bridgeTransactions[sourceTxHash]
    }
  }
})

const selectTransactions = (state: RootState) =>
  state.bridge.bridge.bridgeTransactions

export const selectBridge = (state: RootState) => state.bridge.bridge

export const selectBridgeTransactions = createSelector(
  [selectTransactions, selectActiveNetwork],
  (bridgeTransactions, activeNetwork) => {
    return Object.values(bridgeTransactions).reduce<
      BridgeState['bridgeTransactions']
    >((txs, btx) => {
      const isMainnet = !activeNetwork.isTestnet
      // go figure
      const bridgeTx = btx as BridgeTransaction
      if (bridgeTx.environment === (isMainnet ? 'main' : 'test')) {
        txs[bridgeTx.sourceTxHash] = bridgeTx
      }
      return txs
    }, {})
  }
)

export const { addBridgeTransaction, popBridgeTransaction } =
  bridgeSlice.actions

export * from './types'

export default bridgeSlice.reducer
