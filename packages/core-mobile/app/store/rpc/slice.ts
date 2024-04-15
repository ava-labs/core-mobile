import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RpcState } from 'store/rpc'
import { RootState } from 'store/index'
import { TransactionResponse } from 'ethers'
import { Request, RequestStatus, RpcError } from './types'

export const reducerName = 'rpc'

const initialState: RpcState = {
  requestStatuses: {}
}

const rpcSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    updateRequestStatus: (
      state,
      action: PayloadAction<{
        id: number
        status: RequestStatus
      }>
    ) => {
      const {
        id,
        status: { result, error }
      } = action.payload

      state.requestStatuses[id] = { result, error }
    }
  }
})

// selectors
export const selectRequestStatus =
  (requestId: number) => (state: RootState) => {
    return state.rpc.requestStatuses[requestId]
  }

// actions
export const onRequest = createAction<Request>(`${reducerName}/onRequest`)

export const onRequestApproved = createAction<{
  request: Request
  data: unknown
}>(`${reducerName}/onRequestApproved`)

export const onRequestRejected = createAction<{
  request: Request
  error: RpcError
}>(`${reducerName}/onRequestRejected`)

export const waitForTransactionReceipt = createAction<{
  txResponse: TransactionResponse
  requestId: number
}>(`${reducerName}/waitForTransactionReceipt`)

export const { updateRequestStatus } = rpcSlice.actions

export const rpcReducer = rpcSlice.reducer
