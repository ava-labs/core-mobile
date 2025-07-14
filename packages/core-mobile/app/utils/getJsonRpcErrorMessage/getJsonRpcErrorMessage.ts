import { JsonRpcError } from '@metamask/rpc-errors'
import { isError } from 'ethers'

export const getJsonRpcErrorMessage = (error: unknown): string => {
  if (error instanceof JsonRpcError) {
    return parseJsonRpcError(error)
  }

  if (error instanceof Error) {
    // some errors have a `details` property that contains a more detailed and user friendly error message
    // (i.e. BridgeError object thrown by the @avalabs/bridge-unified)
    if ('details' in error && typeof error.details === 'string') {
      return error.details
    }

    return error.message
  }

  return 'Unexpected error'
}

function getSolanaErrorMessage(errorMessage: string): string | null {
  if (errorMessage.includes('-32002')) {
    if (errorMessage.includes('Blockhash not found')) {
      return 'Transaction failed: The network is experiencing high load. Please try again.'
    }
    return 'Transaction failed: Please verify your transaction details and try again.'
  }

  if (errorMessage.includes('-32003')) {
    return 'Transaction failed: Invalid signature. Please check your account has sufficient permissions.'
  }

  if (errorMessage.includes('-32004')) {
    return 'Transaction failed: Network timeout. Please try again.'
  }

  if (errorMessage.includes('-32005')) {
    return 'Transaction failed: Network is temporarily experiencing delays. Please try again in a moment.'
  }

  if (errorMessage.includes('-32007') || errorMessage.includes('-32009')) {
    return 'Transaction failed: Network synchronization issue. Please try again.'
  }

  if (errorMessage.includes('-32010')) {
    return 'Transaction failed: Invalid transaction data. Please check your transaction details.'
  }

  if (errorMessage.includes('-32013')) {
    return 'Transaction failed: Invalid signature format.'
  }

  if (errorMessage.includes('-32014')) {
    return 'Transaction failed: Network is processing your request. Please try again in a moment.'
  }

  if (errorMessage.includes('-32015')) {
    return 'Transaction failed: Unsupported transaction version. Please update your wallet.'
  }

  if (errorMessage.includes('-32016')) {
    return 'Transaction failed: Please try again in a moment.'
  }

  if (errorMessage.includes('-32602')) {
    return 'Transaction failed: Invalid parameters. Please check your transaction details.'
  }

  return null
}

/**
 * Handles JSON-RPC error cases and returns a user-friendly error message.
 * @param error - The error object to process.
 * @returns A string containing the appropriate error message.
 */
export const parseJsonRpcError = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: JsonRpcError<any>,
  customMessage?: string
): string => {
  const mainMessage = customMessage || error.message
  const cause = error.data?.cause

  // Handle detailed error message based on cause
  if (cause?.error?.message) {
    // Try to get Solana specific error message
    const solanaError = getSolanaErrorMessage(cause.error.message)
    if (solanaError) {
      return solanaError
    }

    // Handle existing cases for other chains
    if (cause.error.message.startsWith('transaction underpriced')) {
      return "Transaction failed. The gas price or max priority fee is too low compared to the network's current minimum requirement. Please increase the gas and try again."
    } else if (cause.error.message === 'already known') {
      /**
       * Occurs when a user resubmits the exact same transaction (same nonce, sender, and data)
       * that’s already in the mempool or has been mined, causing the node to reject it as a duplicate.
       */
      return 'This transaction has already been submitted. Try resubmitting with a higher gas fee or wait for it to complete.'
    }
    return `${mainMessage}\nError: ${cause.error.message}`
  }

  /**
   * Handles the REPLACEMENT_UNDERPRICED case.
   * Occurs when a user attempts to replace a pending transaction (same nonce) with a new one,
   * but the new transaction's gas fees (maxFeePerGas or maxPriorityFeePerGas) are too low—
   * typically not at least 10% higher than the original.
   */
  if (isError(cause, 'REPLACEMENT_UNDERPRICED')) {
    return 'Transaction failed due to an already pending transaction and network congestion. To replace the pending transaction, increase the gas and try again.'
  }

  // Handles INSUFFICIENT_FUNDS case
  if (isError(cause, 'INSUFFICIENT_FUNDS')) {
    return "You don't have enough funds for this transaction (including gas fees). Please add more funds or reduce the amount."
  }

  // Handles NONCE_EXPIRED case
  if (isError(cause, 'NONCE_EXPIRED')) {
    return 'Transaction failed because the nonce was already used. Please try submitting again.'
  }

  // Fallback for cause with a message only
  if (cause?.message) {
    return `${mainMessage}\nError: ${cause.message}`
  }

  // Fallback for error without cause
  return mainMessage
}
