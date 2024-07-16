import { RpcRequest } from '@avalabs/vm-module-types'
import { CORE_MOBILE_TOPIC } from '../types'

export const isInAppRequest = (request: RpcRequest): boolean => {
  return request.sessionId === CORE_MOBILE_TOPIC
}
