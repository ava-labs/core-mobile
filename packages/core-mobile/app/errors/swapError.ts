import { rpcErrors } from '@metamask/rpc-errors'

enum SwapErrorCode {
  MISSING_PARAM = 'MISSING_PARAM',
  NETWORK_NOT_SUPPORTED = 'NETWORK_NOT_SUPPORTED',
  CANNOT_BUILD_TRANSACTION = 'CANNOT_BUILD_TRANSACTION',
  CANNOT_FETCH_ALLOWANCE = 'CANNOT_FETCH_ALLOWANCE',
  CANNOT_FETCH_SPENDER = 'CANNOT_FETCH_SPENDER',
  APPROVAL_TX_FAILED = 'APPROVAL_TX_FAILED',
  SWAP_TX_FAILED = 'SWAP_TX_FAILED'
}

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
