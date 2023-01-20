import { IClientMeta } from '@walletconnect/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { AppListenerEffectAPI } from 'store'
import { addRequest, removeRequest, onSendRpcResult } from '../slice'
import { RpcMethod } from '../types'
import { DappRpcRequest, RpcRequestHandler } from './types'

export type SessionRequestRpcRequest = DappRpcRequest<
  RpcMethod.SESSION_REQUEST,
  {
    peerId: string
    chainId: string | null | undefined
    peerMeta: IClientMeta | null
  }[]
>

class SessionRequestHandler
  implements RpcRequestHandler<SessionRequestRpcRequest>
{
  methods = [RpcMethod.SESSION_REQUEST]

  handle = async (
    action: PayloadAction<SessionRequestRpcRequest['payload'], string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    listenerApi.dispatch(
      addRequest({
        payload: action.payload
      })
    )
  }

  approve = async (
    action: PayloadAction<{ request: SessionRequestRpcRequest }, string>,
    listenerApi: AppListenerEffectAPI
  ) => {
    const request = action.payload.request
    listenerApi.dispatch(removeRequest(request.payload.id))
    listenerApi.dispatch(onSendRpcResult({ request }))
  }
}
export const sessionRequestHandler = new SessionRequestHandler()
