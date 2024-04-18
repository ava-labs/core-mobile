import { v4 as uuidv4 } from 'uuid'
import { EVM_IDENTIFIER } from 'consts/walletConnect'
import { generateRandomNumberId } from 'utils/generateRandomNumberId'
import { PeerMeta, RpcMethod, RpcProvider, RpcRequest } from './types'

// this is the session id for all Core Mobile in-app requests
// it stays the same during an app session
const CORE_MOBILE_TOPIC = uuidv4()

const CORE_MOBILE_META: PeerMeta = {
  name: 'Core',
  description: 'Core Mobile Wallet',
  url: 'https://core.app/',
  icons: []
}

export const createInAppRequest = ({
  method,
  params,
  chainId
}: {
  method: RpcMethod
  params: unknown
  chainId: string
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
