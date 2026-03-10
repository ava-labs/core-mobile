import { isSdkError } from '@avalabs/fusion-sdk'
import type { QuoterDoneReason } from '@avalabs/fusion-sdk'

const INSUFFICIENT_BALANCE_FOR_FEES =
  'Insufficient balance to complete swap and cover gas fees'

export class FusionQuoteError extends Error {
  constructor(message: string, public readonly reason?: QuoterDoneReason) {
    super(message)
    this.name = 'FusionQuoteError'
  }
}

export const fusionErrors = {
  // Quote errors
  noQuotes(): FusionQuoteError {
    return new FusionQuoteError(
      'No quotes available right now. Please try again.',
      'no-quotes'
    )
  },
  noEligibleServices(): FusionQuoteError {
    return new FusionQuoteError(
      'Swap not supported for this token pair.\nPlease try a different pair.',
      'no-eligible-services'
    )
  },

  // Service / initialisation errors
  serviceNotInitialized(): FusionQuoteError {
    return new FusionQuoteError('Fusion service is not initialized')
  },
  unknownServiceType(serviceType: string): FusionQuoteError {
    return new FusionQuoteError(`Unknown service type: ${serviceType}`)
  },

  // Type-conversion / validation errors
  erc721Unsupported(): FusionQuoteError {
    return new FusionQuoteError('ERC721 tokens are not supported for swaps')
  },
  erc1155Unsupported(): FusionQuoteError {
    return new FusionQuoteError('ERC1155 tokens are not supported for swaps')
  },
  missingDecimals(): FusionQuoteError {
    return new FusionQuoteError('Token must have decimals for swaps')
  },
  erc20MissingAddress(): FusionQuoteError {
    return new FusionQuoteError('ERC20 token must have an address')
  },
  splMissingAddress(): FusionQuoteError {
    return new FusionQuoteError('SPL token must have an address')
  },
  networkMissingCaip2(chainName: string): FusionQuoteError {
    return new FusionQuoteError(`Network ${chainName} is missing caip2Id`)
  },

  // Input validation errors (swap screen)
  enterAmount(): FusionQuoteError {
    return new FusionQuoteError('Please enter an amount')
  },
  exceedsBalance(): FusionQuoteError {
    return new FusionQuoteError('Amount exceeds available balance')
  },
  noDestinationToken(symbol: string): FusionQuoteError {
    return new FusionQuoteError(`You don't have any ${symbol} token for swap`)
  },
  incompatibleNetworks(fromSymbol: string, toSymbol: string): FusionQuoteError {
    return new FusionQuoteError(
      `Cannot swap from ${fromSymbol} network to ${toSymbol} network. Please select a different token.`
    )
  },
  belowMinimumAmount(formattedMin: string): FusionQuoteError {
    return new FusionQuoteError(`Minimum amount is ${formattedMin}.`)
  },
  insufficientBalanceForFees(): FusionQuoteError {
    return new FusionQuoteError(INSUFFICIENT_BALANCE_FOR_FEES)
  }
}

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

  let actualError: Error | undefined

  if (isSdkError(error)) {
    actualError = error.walk()
  }

  const message = actualError?.message ?? error.message

  // Common error patterns
  if (message.includes('insufficient funds')) {
    return INSUFFICIENT_BALANCE_FOR_FEES
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
