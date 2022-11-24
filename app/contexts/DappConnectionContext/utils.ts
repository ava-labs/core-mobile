import { DappRpcRequest } from 'store/rpc/handlers/types'
import Logger from 'utils/Logger'

export const hasValidPayload = (
  event: DappRpcRequest<string, unknown> | undefined
) => {
  if (event && 'payload' in event) {
    return true
  }

  Logger.error('dapp event without payload')
  return false
}
