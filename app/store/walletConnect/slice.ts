import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  ApprovedAppMeta,
  DappRpcRequests,
  WalletConnectState
} from 'store/walletConnect/types'
import { RootState } from 'store/index'
import { EthereumProviderError, EthereumRpcError } from 'eth-rpc-errors'
import { DappRpcRequest, TypedJsonRpcRequest } from './handlers/types'

export const reducerName = 'walletConnect'

const initialState = {
  requests: [],
  approvedDApps: []
} as WalletConnectState

const walletConnectSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addRequest: (state, action: PayloadAction<DappRpcRequests>) => {
      if (
        state.requests.some(r => r.payload.id === action.payload.payload.id)
      ) {
        // the request is already added
        return
      }
      state.requests.push(action.payload)
    },
    removeRequest: (state, action: PayloadAction<number>) => {
      state.requests = state.requests.filter(
        request => request.payload.id !== action.payload
      )
    },
    updateRequest: (state, action: PayloadAction<DappRpcRequests>) => {
      const index = state.requests.findIndex(
        r => r.payload.id === action.payload.payload.id
      )
      if (index < 0) {
        return
      }

      state.requests[index] = action.payload
    },
    setDApps: (state, action: PayloadAction<ApprovedAppMeta[]>) => {
      state.approvedDApps = action.payload
    },
    removeDApp: (
      state,
      action: PayloadAction<{
        peerId: string
      }>
    ) => {
      state.approvedDApps = state.approvedDApps.filter(
        value => value.peerId !== action.payload.peerId
      )
    }
  }
})

// selectors
export const selectRpcRequests = (state: RootState) =>
  state.walletConnect.requests
export const selectApprovedDApps = (state: RootState) => {
  return Object.values(state.walletConnect.approvedDApps)
}

// actions
export const rpcRequestReceived = createAction<
  TypedJsonRpcRequest<string, unknown>
>(`${reducerName}/rpcRequestReceived`)
export const rpcRequestApproved = createAction<{
  request: DappRpcRequest<string, unknown>
  result: unknown
}>(`${reducerName}/rpcRequestApproved`)

export const sendRpcResult = createAction<{
  request: DappRpcRequest<string, unknown>
  result?: unknown
}>(`${reducerName}/sendRpcResult`)
export const sendRpcError = createAction<{
  request: DappRpcRequest<string, unknown>
  error?: EthereumRpcError<unknown> | EthereumProviderError<unknown>
}>(`${reducerName}/sendRpcError`)
export const {
  addRequest,
  removeRequest,
  updateRequest,
  removeDApp,
  setDApps
} = walletConnectSlice.actions

export const walletConnectReducer = walletConnectSlice.reducer
