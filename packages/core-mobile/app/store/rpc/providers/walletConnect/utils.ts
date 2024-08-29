import { JsonRpcError, providerErrors } from '@metamask/rpc-errors'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Request, RpcMethod } from '../../types'

export const isSessionProposal = (
  request: Request
): request is WCSessionProposal => {
  return request.method === RpcMethod.WC_SESSION_REQUEST
}

export const isUserRejectedError = (error: unknown): boolean => {
  if (error instanceof JsonRpcError) {
    const rejectedCode = providerErrors.userRejectedRequest().code
    return (
      error.code === rejectedCode ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.cause as any)?.code === rejectedCode
    )
  }

  return false
}
