/**
 * Check if error is user rejection (user cancelled transaction)
 * Don't show error toast for these - user intentionally cancelled
 */
export function isUserRejectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return error.message.toLowerCase().includes('user rejected')
}

/**
 * Check if error is gas estimation failure
 * These are retryable with next quote (auto mode only)
 */
export function isGasEstimationError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.message.toLowerCase().includes('gas estimation')
}

/**
 * Check if error is invalid response from aggregator
 * These are retryable with next quote (auto mode only)
 */
export function isInvalidResponseError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return (
    message.includes('invalid response') ||
    message.includes('response validation failed')
  )
}

/**
 * Determine if we should retry with next quote
 * Only retry for specific error types
 */
export function shouldRetryWithNextQuote(error: unknown): boolean {
  return isGasEstimationError(error) || isInvalidResponseError(error)
}

/**
 * Get user-friendly error message
 */
export function getSwapErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) return 'Unknown error occurred'

  const message = error.message

  // Common error patterns
  if (message.includes('insufficient funds')) {
    return 'Insufficient balance to complete swap and cover gas fees'
  }
  if (message.includes('slippage')) {
    return 'Price moved too much. Try increasing slippage tolerance.'
  }
  if (message.includes('expired')) {
    return 'Quote expired. Please try again.'
  }
  if (message.includes('gas estimation')) {
    return 'Unable to estimate gas. The swap may fail.'
  }

  // Default to original message
  return message
}
