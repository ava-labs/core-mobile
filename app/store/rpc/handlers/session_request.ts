import { IClientMeta } from '@walletconnect/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { RpcMethod } from 'services/walletconnect/types'
import { AppListenerEffectAPI } from 'store'
import { approveSession } from 'contexts/DappConnectionContext/useWalletConnect'
import { addRequest, removeRequest } from '../slice'
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
    console.log('called')
    const request = action.payload.request
    listenerApi.dispatch(removeRequest(request.payload.id))

    const peerId = request.payload.params[0]?.peerId
    console.log('peerId', peerId)
    peerId && approveSession(peerId)
  }
}
export const sessionRequestHandler = new SessionRequestHandler()
