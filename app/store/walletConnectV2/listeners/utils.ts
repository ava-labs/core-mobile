import { Request, RpcMethod, SessionProposal } from '../types'

export const isSessionProposal = (
  request: Request
): request is SessionProposal => {
  return request.method === RpcMethod.SESSION_REQUEST
}
