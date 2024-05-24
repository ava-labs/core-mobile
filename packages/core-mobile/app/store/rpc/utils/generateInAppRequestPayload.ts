import { generateRandomNumberId } from 'utils/generateRandomNumberId'
import {
  RpcMethod,
  RpcProvider,
  RpcRequest,
  CORE_MOBILE_META,
  CORE_MOBILE_TOPIC,
  EVM_IDENTIFIER
} from '../types'

export const generateInAppRequestPayload = ({
  method,
  params,
  chainId
}: {
  method: RpcMethod
  params: unknown
  chainId?: string
}): RpcRequest<RpcMethod> => ({
  provider: RpcProvider.CORE_MOBILE,
  method: method,
  data: {
    id: generateRandomNumberId(),
    topic: CORE_MOBILE_TOPIC,
    params: {
      request: {
        method,
        params
      },
      chainId: `${EVM_IDENTIFIER}:${chainId}`
    }
  },
  peerMeta: CORE_MOBILE_META
})
