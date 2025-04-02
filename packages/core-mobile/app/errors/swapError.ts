import { JsonRpcError, rpcErrors } from '@metamask/rpc-errors'
import { parseJsonRpcError } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'

enum SwapErrorCode {
  MISSING_PARAM = 'MISSING_PARAM',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  CANNOT_BUILD_TRANSACTION = 'CANNOT_BUILD_TRANSACTION',
  CANNOT_FETCH_ALLOWANCE = 'CANNOT_FETCH_ALLOWANCE',
  CANNOT_FETCH_SPENDER = 'CANNOT_FETCH_SPENDER',
  APPROVAL_TX_FAILED = 'APPROVAL_TX_FAILED',
  SWAP_TX_FAILED = 'SWAP_TX_FAILED'
}

type ObjWithError = { error: string }

const isObjWithError = (error: unknown): error is ObjWithError =>
  Boolean(typeof error === 'object' && error && 'error' in error)

export const swapError = {
  missingParam: (param: string) =>
    rpcErrors.internal({
      message: `Missing required parameter: ${param}`,
      data: { code: SwapErrorCode.MISSING_PARAM }
    }),
  networkNotSupported: (network: string) =>
    rpcErrors.internal({
      message: `Network not supported: ${network}`,
      data: { code: SwapErrorCode.NETWORK_NOT_SUPPORTED }
    }),
  cannotBuildTx: (error: unknown) =>
    rpcErrors.internal({
      message: 'Pricing provider did not respond with a valid transaction',
      data: { cause: error, code: SwapErrorCode.CANNOT_BUILD_TRANSACTION }
    }),
  cannotFetchAllowance: (error: unknown) =>
    rpcErrors.internal({
      message: 'There was an error fetching your spend approvals',
      data: { cause: error, code: SwapErrorCode.CANNOT_FETCH_ALLOWANCE }
    }),
  cannotFetchSpender: (error: unknown) =>
    rpcErrors.internal({
      message: 'There was an error fetching the spender address',
      data: { cause: error, code: SwapErrorCode.CANNOT_FETCH_SPENDER }
    }),
  approvalTxFailed: (error: unknown) =>
    rpcErrors.internal({
      message:
        'Token approval transaction failed. The transaction may not have been signed or broadcasted successfully.',
      data: { cause: error, code: SwapErrorCode.APPROVAL_TX_FAILED }
    }),
  swapTxFailed: (error: unknown) =>
    rpcErrors.internal({
      message:
        'Swap transaction failed. The transaction may not have been signed or broadcasted successfully.',
      data: { cause: error, code: SwapErrorCode.SWAP_TX_FAILED }
    })
}

export const humanizeParaswapRateError = (errorMsg: string): string => {
  switch (errorMsg) {
    case 'ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT':
      return 'Slippage tolerance exceeded, increase the slippage and try again.'
    case 'Internal Error while computing the price':
      return 'An error occurred while computing the price'
    default:
      return errorMsg
  }
}

export function humanizeSwapError(err: unknown): string {
  let errorString = ''

  if (isObjWithError(err)) {
    errorString = err.error
  } else if (typeof err === 'string') {
    errorString = err
  }

  if (
    errorString.toLowerCase().startsWith('not enough') &&
    errorString.includes('allowance')
  ) {
    return 'Not enough allowance.'
  }

  if (errorString.includes('-32000')) {
    return 'Another transaction is pending. Increase gas price to overwrite it.'
  }

  if (errorString.toLowerCase().includes('network error')) {
    return 'Network error, please try again later.'
  }

  if (err instanceof JsonRpcError && err.data.cause instanceof JsonRpcError) {
    return parseJsonRpcError(err.data.cause, err.message)
  }

  return errorString || 'An unknown error occurred'
}
