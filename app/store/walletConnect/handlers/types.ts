import { PayloadAction } from '@reduxjs/toolkit'
import { PeerMeta } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { RpcMethod } from '../types'

export interface TypedJsonRpcRequest<Method extends string, Params = unknown>
  extends JsonRpcRequest<Params> {
  method: Method
  peerMeta: PeerMeta
  peerId: string
}

export interface DappRpcRequest<Method extends string, Params = unknown> {
  payload: TypedJsonRpcRequest<Method, Params>
}

export interface RpcRequestHandler<T extends DappRpcRequest<string, unknown>> {
  methods: RpcMethod[]
  handle: (
    action: PayloadAction<T['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => Promise<void>

  approve?: (
    action: PayloadAction<{ request: T; data?: unknown }, string>,
    listenerApi: AppListenerEffectAPI
  ) => Promise<void>
}
