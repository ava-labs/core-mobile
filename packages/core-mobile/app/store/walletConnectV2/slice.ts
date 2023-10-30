import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { WalletConnectState } from 'store/walletConnectV2'
import { RootState } from 'store/index'
import { PeerMeta, Session } from 'services/walletconnectv2/types'
import { Request, RpcError } from './types'

export const reducerName = 'walletConnectV2'

const initialState: WalletConnectState = {
  requestStatuses: {}
}

const walletConnectSlice = createSlice({
  name: reducerName,
  initialState,
  reducers: {
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
    }
  }
})

// selectors
export const selectRequestStatus =
  (requestId: number) => (state: RootState) => {
    return state.walletConnectV2.requestStatuses[requestId]
  }

// actions
export const onDisconnect = createAction<PeerMeta>(
  `${reducerName}/onDisconnect`
)

export const onRequest = createAction<Request>(`${reducerName}/onRequest`)

export const onRequestApproved = createAction<{
  request: Request
  data: unknown
}>(`${reducerName}/onRequestApproved`)

export const onRequestRejected = createAction<{
  request: Request
  error: RpcError
}>(`${reducerName}/onRequestRejected`)

export const onSendRpcResult = createAction<{
  request: Request
  result?: unknown
}>(`${reducerName}/onSendRpcResult`)

export const onSendRpcError = createAction<{
  request: Request
  error: RpcError
}>(`${reducerName}/onSendRpcError`)

export const newSession = createAction<string>(`${reducerName}/newSession`)

export const killSessions = createAction<Session[]>(
  `${reducerName}/killSessions`
)

export const { updateRequestStatus } = walletConnectSlice.actions

export const walletConnectReducer = walletConnectSlice.reducer
