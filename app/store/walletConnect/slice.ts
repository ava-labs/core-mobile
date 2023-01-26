import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ApprovedAppMeta, WalletConnectState } from 'store/walletConnect'
import { RootState } from 'store/index'
import { EthereumProviderError, EthereumRpcError } from 'eth-rpc-errors'
import { PeerMeta } from 'services/walletconnect/types'
import { DappRpcRequest } from './handlers/types'

export const reducerName = 'walletConnect'

const initialState = {
  requests: [],
  requestStatuses: {},
  approvedDApps: []
} as WalletConnectState

const walletConnectSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
    addRequest: (
      state,
      action: PayloadAction<DappRpcRequest<string, unknown>>
    ) => {
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

      if (state.requestStatuses[action.payload])
        delete state.requestStatuses[action.payload]
    },
    updateRequestStatus: (
      state,
      action: PayloadAction<{
        id: number
        status: { result?: unknown; error?: Error }
      }>
    ) => {
      const {
        id,
        status: { result, error }
      } = action.payload

      state.requestStatuses[id] = { result, error }
    },
    addDapp: (state, action: PayloadAction<ApprovedAppMeta>) => {
      state.approvedDApps.push(action.payload)
    },
    removeDApps: (state, action: PayloadAction<string[]>) => {
      state.approvedDApps = state.approvedDApps.filter(
        value => !action.payload.includes(value.peerId)
      )
    }
  }
})

// selectors
export const selectApprovedDApps = (state: RootState) => {
  return Object.values(state.walletConnect.approvedDApps)
}

export const selectRequestStatus =
  (requestId: number) => (state: RootState) => {
    return state.walletConnect.requestStatuses[requestId]
  }

// actions
export const onDisconnect = createAction<PeerMeta>(
  `${reducerName}/onDisconnect`
)

export const onRequestApproved = createAction<{
  request: DappRpcRequest<string, unknown>
  data: unknown
}>(`${reducerName}/onRequestApproved`)

export const onRequestRejected = createAction<{
  request: DappRpcRequest<string, unknown>
  error?: EthereumRpcError<string> | EthereumProviderError<string>
}>(`${reducerName}/onRequestRejected`)

export const onSendRpcResult = createAction<{
  request: DappRpcRequest<string, unknown>
  result?: unknown
}>(`${reducerName}/onSendRpcResult`)

export const onSendRpcError = createAction<{
  request: DappRpcRequest<string, unknown>
  error?: EthereumRpcError<string> | EthereumProviderError<string>
}>(`${reducerName}/onSendRpcError`)

export const onRequestPostApproved = createAction<
  DappRpcRequest<string, unknown>
>(`${reducerName}/onRequestPostApproved`)

export const newSession = createAction<string>(`${reducerName}/newSession`)

export const killSessions = createAction<ApprovedAppMeta[]>(
  `${reducerName}/killSessions`
)

export const {
  addRequest,
  removeRequest,
  updateRequestStatus,
  addDapp,
  removeDApps
} = walletConnectSlice.actions

export const walletConnectReducer = walletConnectSlice.reducer
