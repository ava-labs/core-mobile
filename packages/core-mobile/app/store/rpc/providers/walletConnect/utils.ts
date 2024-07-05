import { providerErrors } from '@metamask/rpc-errors'
import { RpcError } from '@avalabs/vm-module-types'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Request, RpcMethod } from '../../types'

export const isSessionProposal = (
  request: Request
): request is WCSessionProposal => {
  return request.method === RpcMethod.WC_SESSION_REQUEST
}

export const isUserRejectedError = (error: RpcError): boolean =>
  error.code === providerErrors.userRejectedRequest().code
