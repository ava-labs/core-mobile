import { Request, RpcMethod, RpcRequest } from '../types'

export const isRpcRequest = (
  request: Request
): request is RpcRequest<RpcMethod> => {
  return request.method !== RpcMethod.WC_SESSION_REQUEST
}
