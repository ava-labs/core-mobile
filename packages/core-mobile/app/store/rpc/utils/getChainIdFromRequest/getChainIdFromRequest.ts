import { RpcMethod, RpcRequest } from '../../types'

export const getChainIdFromRequest = (
  request: RpcRequest<RpcMethod>
): number => {
  if (!request.data.params.chainId) {
    throw new Error('chainId is missing from the request')
  }

  const parts = request.data.params.chainId.split(':')
  if (parts.length < 2 || isNaN(Number(parts[1]))) {
    throw new Error('chainId is not in a valid format')
  }

  return Number(parts[1])
}
