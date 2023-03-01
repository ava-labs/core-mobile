import * as Navigation from 'utils/Navigation'
import AppNavigation from 'navigation/AppNavigation'
import { showSimpleToast } from 'components/Snackbar'
import { RpcMethod } from 'store/walletConnectV2'
import { PeerMeta } from 'services/walletconnect/types'
import {
  DappRpcRequest,
  RpcRequestHandler,
  DEFERRED_RESULT,
  HandleResponse,
  ApproveResponse
} from './types'

export type SessionRequestRpcRequest = DappRpcRequest<
  RpcMethod.SESSION_REQUEST,
  {
    peerId: string
    chainId: string | null | undefined
    peerMeta: PeerMeta
  }[]
>

class SessionRequestHandler
  implements RpcRequestHandler<SessionRequestRpcRequest, never>
{
  methods = [RpcMethod.SESSION_REQUEST]

  handle = async (request: SessionRequestRpcRequest): HandleResponse => {
    Navigation.navigate({
      name: AppNavigation.Root.Wallet,
      params: {
        screen: AppNavigation.Modal.SessionProposal,
        params: { request }
      }
    })

    return { success: true, value: DEFERRED_RESULT }
  }

  approve = async (payload: {
    request: SessionRequestRpcRequest
  }): ApproveResponse => {
    const siteName = payload.request.payload.peerMeta?.name ?? ''
    const message = `Connected to ${siteName}`

    showSimpleToast(message)

    return { success: true }
  }
}
export const sessionRequestHandler = new SessionRequestHandler()
