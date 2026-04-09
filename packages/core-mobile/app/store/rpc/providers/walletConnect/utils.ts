import { JsonRpcError, providerErrors } from '@metamask/rpc-errors'
import { WCSessionProposal } from 'store/walletConnectV2/types'
import { Request, RpcMethod } from '../../types'

export const isSessionProposal = (
  request: Request
): request is WCSessionProposal => {
  return request.method === RpcMethod.WC_SESSION_REQUEST
}

// Ledger rejection messages thrown as plain Errors by handleLedgerError
// (see services/wallet/utils.ts). These are user-initiated cancellations
// but don't use JsonRpcError, so we match them by message.
const LEDGER_REJECTION_PATTERNS = [
  'rejected by user on ledger',
  'user_cancelled'
]

export const isUserRejectedError = (error: unknown): boolean => {
  if (error instanceof JsonRpcError) {
    const rejectedCode = providerErrors.userRejectedRequest().code
    return (
      error.code === rejectedCode ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error.cause as any)?.code === rejectedCode
    )
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return LEDGER_REJECTION_PATTERNS.some(pattern => msg.includes(pattern))
  }

  return false
}
