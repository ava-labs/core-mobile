import { generateRandomNumberId } from 'utils/generateRandomNumberId'
import {
  PeerMeta,
  RpcMethod,
  RpcProvider,
  RpcRequest,
  CORE_MOBILE_META,
  CORE_MOBILE_TOPIC
} from '../types'

export const generateInAppRequestPayload = ({
  method,
  params,
  chainId,
  context,
  peerMeta
}: {
  method: RpcMethod
  params: unknown
  chainId?: string
  context?: Record<string, unknown>
  peerMeta?: PeerMeta
}): RpcRequest<RpcMethod> => ({
  provider: RpcProvider.CORE_MOBILE,
  method,
  data: {
    id: generateRandomNumberId(),
    topic: CORE_MOBILE_TOPIC,
    params: {
      request: {
        method,
        params
      },
      chainId: chainId ?? ''
    }
  },
  peerMeta: peerMeta ?? CORE_MOBILE_META,
  context
})
