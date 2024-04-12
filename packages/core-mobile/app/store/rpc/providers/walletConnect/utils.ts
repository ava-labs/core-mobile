import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Request, RpcMethod } from '../../types'

export const isSessionProposal = (
  request: Request
): request is WCSessionProposal => {
  return request.method === RpcMethod.SESSION_REQUEST
}
