import { ethErrors } from 'eth-rpc-errors'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Request, RpcMethod } from '../../types'

export const isSessionProposal = (
  request: Request
): request is WCSessionProposal => {
  return request.method === RpcMethod.WC_SESSION_REQUEST
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isUserRejectedError = (error: any): boolean =>
  error?.code === ethErrors.provider.userRejectedRequest().code
