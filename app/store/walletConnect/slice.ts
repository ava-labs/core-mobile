import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ApprovedAppMeta, WalletConnectState } from 'store/walletConnect'
import { RootState } from 'store/index'
import { PeerMeta } from 'services/walletconnect/types'
import { RpcError } from 'store/walletConnectV2'
import { DappRpcRequest } from './handlers/types'

export const reducerName = 'walletConnect'

const initialState: WalletConnectState = {
  requestStatuses: {},
  approvedDApps: []
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
    },
    addDapp: (state, action: PayloadAction<ApprovedAppMeta>) => {
      state.approvedDApps.push(action.payload)
    },
    removeDApps: (state, action: PayloadAction<string[]>) => {
      state.approvedDApps = state.approvedDApps.filter(
        value => !action.payload.includes(value.peerId)
      )
    },
    // remove a dapp by its clientId
    // useful when a dapp disconnects/kills the connection and we no longer can remove a dapp by its peerId
    removeDapp: (state, action: PayloadAction<string>) => {
      const clientId = action.payload
      state.approvedDApps = state.approvedDApps.filter(
        value => value.clientId !== clientId
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
export const onRequest = createAction<DappRpcRequest<string, unknown>>(
  `${reducerName}/onRequest`
)

export const onDisconnect = createAction<{
  clientId: string
  peerMeta: PeerMeta
}>(`${reducerName}/onDisconnect`)

export const onRequestApproved = createAction<{
  request: DappRpcRequest<string, unknown>
  data: unknown
}>(`${reducerName}/onRequestApproved`)

export const onRequestRejected = createAction<{
  request: DappRpcRequest<string, unknown>
  error?: RpcError
}>(`${reducerName}/onRequestRejected`)

export const onSendRpcResult = createAction<{
  request: DappRpcRequest<string, unknown>
  result?: unknown
}>(`${reducerName}/onSendRpcResult`)

export const onSendRpcError = createAction<{
  request: DappRpcRequest<string, unknown>
  error?: RpcError
}>(`${reducerName}/onSendRpcError`)

export const newSession = createAction<string>(`${reducerName}/newSession`)

export const killSessions = createAction<ApprovedAppMeta[]>(
  `${reducerName}/killSessions`
)

export const { updateRequestStatus, addDapp, removeDApps, removeDapp } =
  walletConnectSlice.actions

export const walletConnectReducer = walletConnectSlice.reducer
