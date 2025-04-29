import { PayloadAction, createSlice } from '@reduxjs/toolkit'
import { RootState } from 'store/types'
import { BridgeTransfer } from '@avalabs/bridge-unified'
import { initialState, PendingTransfers, SourceTxHash } from './types'

export const reducerName = 'unifiedBridge'

export const unifiedBridgeSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    setPendingTransfer: (state, action: PayloadAction<BridgeTransfer>) => {
      const transfer = action.payload
      state.pendingTransfers[transfer.sourceTxHash] = transfer
    },
    removePendingTransfer: (state, action: PayloadAction<SourceTxHash>) => {
      delete state.pendingTransfers[action.payload]
    }
  }
})
export const selectPendingTransfers = (state: RootState): PendingTransfers =>
  state.unifiedBridge.pendingTransfers

export const { setPendingTransfer, removePendingTransfer } =
  unifiedBridgeSlice.actions

export const unifiedBridgeReducer = unifiedBridgeSlice.reducer
