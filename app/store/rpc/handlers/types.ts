import { PayloadAction } from '@reduxjs/toolkit'
import { PeerMeta, RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'

export interface TypedJsonRpcRequest<Method extends string, Params = unknown>
  extends JsonRpcRequest<Params> {
  method: Method
  peerMeta: PeerMeta
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

  onApprove?: (
    action: PayloadAction<{ request: T; result?: unknown }, string>,
    listenerApi: AppListenerEffectAPI
  ) => Promise<void>
}

export type CoreWebAccount = {
  index: number
  active: boolean
  addressC: string
  addressBTC?: string
  name: string
}
