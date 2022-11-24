import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RpcState } from 'store/rpc/types'
import { RootState } from 'store/index'
import { EthereumProviderError, EthereumRpcError } from 'eth-rpc-errors'
import { DappRpcRequest, TypedJsonRpcRequest } from './handlers/types'

const reducerName = 'rpc'

const initialState = {
  requests: []
} as RpcState

const rpcSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addRequest: (
      state,
      action: PayloadAction<DappRpcRequest<string, unknown>>
    ) => {
      state.requests.push(action.payload)
    },
    removeRequest: (state, action: PayloadAction<number>) => {
      state.requests = state.requests.filter(
        request => request.payload.id !== action.payload
      )
    }
  }
})

// selectors
export const selectRpcRequests = (state: RootState) => state.rpc.requests

// actions
export const rpcRequestReceived = createAction<
  TypedJsonRpcRequest<string, unknown>
>(`${reducerName}/rpcRequestReceived`)
export const rpcRequestApproved = createAction<{
  request: DappRpcRequest<string, unknown>
  result: unknown
}>(`${reducerName}/rpcRequestReceived`)

export const sendRpcResult = createAction<{ id: number; result: unknown }>(
  `${reducerName}/sendRpcResult`
)
export const sendRpcError = createAction<{
  id: number
  error?: EthereumRpcError<unknown> | EthereumProviderError<unknown>
}>(`${reducerName}/sendRpcError`)
export const { addRequest, removeRequest } = rpcSlice.actions

export const rpcReducer = rpcSlice.reducer
