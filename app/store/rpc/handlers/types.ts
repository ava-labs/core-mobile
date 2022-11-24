import { PayloadAction } from '@reduxjs/toolkit'
import { PeerMetadata, RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'

export interface TypedJsonRpcRequest<P extends string, T = unknown>
  extends JsonRpcRequest<T> {
  method: P
  peerMeta: PeerMetadata
}

export interface DappRpcRequest<P extends string, T = unknown> {
  payload: TypedJsonRpcRequest<P, T>
}

export interface RpcRequestHandler<T extends DappRpcRequest<string, unknown>> {
  methods: RpcMethod[]
  handle: (
    action: PayloadAction<T['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => Promise<void>

  onApprove?: (
    action: PayloadAction<{ request: T; result?: unknown }, string>,
    listenerApi: AppListenerEffectAPI
  ) => Promise<void>
}
