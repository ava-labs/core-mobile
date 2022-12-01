import { JsonRpcRequest } from '@walletconnect/jsonrpc-types'
import { RpcMethod } from 'services/walletconnect/types'

export function parseMessage(data: JsonRpcRequest<string[]>) {
  const { params, method } = data
  switch (method) {
    case RpcMethod.PERSONAL_SIGN:
      return {
        data: params[0],
        from: params[1],
        password: params[2]
      }
    case RpcMethod.SIGN_TYPED_DATA:
      try {
        return {
          data: JSON.parse(params[1]?.toString() || ''),
          from: params[0]
        }
      } catch (e) {
        return {
          data: params[0],
          from: params[1]
        }
      }
    case RpcMethod.ETH_SIGN:
      return {
        data: params[1],
        from: params[0]
      }
    case RpcMethod.SIGN_TYPED_DATA_V3:
    case RpcMethod.SIGN_TYPED_DATA_V4:
      return {
        data: JSON.parse(params[1]?.toString() || ''),
        from: params[0]
      }
    default:
      return {
        data: params[1],
        from: params[0]
      }
  }
}
