import { Network, NetworkVMType } from '@avalabs/chains-sdk'
import { RpcMethod } from 'store/walletConnectV2'
import { SessionRequestRpcRequest } from '../handlers/session_request'
import { DappRpcRequest } from '../handlers/types'

export const isRequestSupportedOnNetwork = (
  method: string,
  activeNetwork: Network | undefined
): boolean => {
  const declineMethodsPattern = /(^eth_|_watchAsset$)/
  if (
    activeNetwork &&
    activeNetwork.vmName !== NetworkVMType.EVM &&
    declineMethodsPattern.test(method)
  ) {
    return false
  }

  return true
}

export const isSessionRequestRpcRequest = (
  request: DappRpcRequest<string, unknown>
): request is SessionRequestRpcRequest => {
  return request.payload.method === RpcMethod.SESSION_REQUEST
}
