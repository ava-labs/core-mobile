import { RpcMethod } from 'services/walletconnect/types'
import { SessionRequestRpcRequest } from './handlers/session_request'
import { DappRpcRequest } from './handlers/types'

export const isSessionRequestRpcRequest = (
  request: DappRpcRequest<string, unknown>
): request is SessionRequestRpcRequest => {
  return request.payload.method === RpcMethod.SESSION_REQUEST
}
