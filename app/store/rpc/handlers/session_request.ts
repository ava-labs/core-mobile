import { IClientMeta } from '@walletconnect/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { addRequest, removeRequest, sendRpcResult } from '../slice'
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

  onApprove = async (
    action: PayloadAction<
      { request: SessionRequestRpcRequest; result?: unknown },
      string
    >,
    listenerApi: AppListenerEffectAPI
  ) => {
    const request = action.payload.request
    listenerApi.dispatch(removeRequest(request.payload.id))
    listenerApi.dispatch(sendRpcResult({ request }))
  }
}
export const sessionRequestHandler = new SessionRequestHandler()
