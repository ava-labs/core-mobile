import { JsonRpcError, rpcErrors } from '@metamask/rpc-errors'
import { parseJsonRpcError } from 'utils/getJsonRpcErrorMessage/getJsonRpcErrorMessage'

enum SwapErrorCode {
  INCORRECT_TOKEN_ADDRESS = 'INCORRECT_TOKEN_ADDRESS',
  MISSING_PARAM = 'MISSING_PARAM',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  CANNOT_BUILD_TRANSACTION = 'CANNOT_BUILD_TRANSACTION',
  CANNOT_FETCH_ALLOWANCE = 'CANNOT_FETCH_ALLOWANCE',
  CANNOT_FETCH_SPENDER = 'CANNOT_FETCH_SPENDER',
  APPROVAL_TX_FAILED = 'APPROVAL_TX_FAILED',
  SWAP_TX_FAILED = 'SWAP_TX_FAILED',
  WRONG_QUOTE_PROVIDER = 'WRONG_QUOTE_PROVIDER',
  UNABLE_TO_ESTIMATE_GAS = 'UNABLE_TO_ESTIMATE_GAS',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE'
}

export enum ParaswapErrorCode {
  ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT = 'ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT',
  INTERNAL_ERROR_WHILE_COMPUTING_PRICE = 'Internal Error while computing the price'
}

export const ParaswapError = {
  [ParaswapErrorCode.ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT]:
    'Slippage tolerance exceeded, increase the slippage and try again.',
  [ParaswapErrorCode.INTERNAL_ERROR_WHILE_COMPUTING_PRICE]:
    'An error occurred while computing the price'
}

type ObjWithError = { error: string }

const isObjWithError = (error: unknown): error is ObjWithError =>
  Boolean(typeof error === 'object' && error && 'error' in error)

export const swapError = {
  incorrectTokenAddress: (tokenAddress: string) =>
    rpcErrors.internal({
      message: `Incorrect token address: ${tokenAddress}`,
      data: { code: SwapErrorCode.INCORRECT_TOKEN_ADDRESS }
    }),
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
  wrongQuoteProvider: (quoteProvider: string) =>
    rpcErrors.internal({
      message: `Wrong quote provider. Quote provider should be: ${quoteProvider}`,
      data: { code: SwapErrorCode.WRONG_QUOTE_PROVIDER }
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
  insufficientFunds: (error: unknown) =>
    rpcErrors.internal({
      message: 'Insufficient balance for swap',
      data: { cause: error, code: SwapErrorCode.INSUFFICIENT_BALANCE }
    }),
  swapTxFailed: (error: unknown) =>
    rpcErrors.internal({
      message:
        'Swap transaction failed. The transaction may not have been signed or broadcasted successfully.',
      data: { cause: error, code: SwapErrorCode.SWAP_TX_FAILED }
    }),
  unableToEstimateGas: (error: unknown) =>
    rpcErrors.internal({
      message: 'Unable to estimate gas',
      data: { cause: error, code: SwapErrorCode.UNABLE_TO_ESTIMATE_GAS }
    })
}

export const humanizeParaswapRateError = (errorMsg: string): string => {
  switch (errorMsg) {
    case ParaswapErrorCode.ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT:
      return ParaswapError[
        ParaswapErrorCode.ESTIMATED_LOSS_GREATER_THAN_MAX_IMPACT
      ]
    case ParaswapErrorCode.INTERNAL_ERROR_WHILE_COMPUTING_PRICE:
      return ParaswapError[
        ParaswapErrorCode.INTERNAL_ERROR_WHILE_COMPUTING_PRICE
      ]
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

  if (err instanceof JsonRpcError) {
    if (err.data.cause instanceof JsonRpcError) {
      return parseJsonRpcError(err.data.cause, err.message)
    }
    if ('message' in err) {
      return err.message
    }
  }

  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof err.message === 'string'
  ) {
    return err.message
  }

  return errorString || 'An unknown error occurred'
}

export const isSwapTxBuildError = (err: unknown): boolean => {
  if (err instanceof JsonRpcError) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err.data as any)?.code === SwapErrorCode.CANNOT_BUILD_TRANSACTION
    )
  }

  return false
}

export const isGasEstimationError = (err: unknown): boolean => {
  if (err instanceof JsonRpcError) {
    return (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err.data as any)?.code === SwapErrorCode.UNABLE_TO_ESTIMATE_GAS
    )
  }

  return false
}
