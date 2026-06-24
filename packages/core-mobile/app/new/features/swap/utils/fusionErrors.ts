import { isEstimateNativeFeeError, isSdkError } from '@avalabs/fusion-sdk'
import type { QuoterDoneReason } from '@avalabs/fusion-sdk'
import { CCT_CALLBACKS_ERROR_TAG } from '../services/cct/consts'

export type FusionQuoteErrorKind =
  | 'network-fee-only' // gas alone exceeds balance; no bridge fee involved
  | 'provider-specific' // error is specific to this quote's provider and may not repeat on another quote
  | 'other'

export class FusionQuoteError extends Error {
  public readonly reason?: QuoterDoneReason
  public readonly isWarning?: boolean
  public readonly kind: FusionQuoteErrorKind

  constructor(
    message: string,
    options?: {
      reason?: QuoterDoneReason
      isWarning?: boolean
      kind?: FusionQuoteErrorKind
    }
  ) {
    super(message)
    this.name = 'FusionQuoteError'
    this.reason = options?.reason
    this.isWarning = options?.isWarning
    this.kind = options?.kind ?? 'other'
  }
}

export const fusionErrors = {
  // Quote errors
  noQuotes(): FusionQuoteError {
    return new FusionQuoteError(
      'No quotes available right now. Please try again.',
      { reason: 'no-quotes' }
    )
  },
  noEligibleServices(): FusionQuoteError {
    return new FusionQuoteError(
      'Swap not supported for this token pair.\nPlease try a different pair.',
      { reason: 'no-eligible-services' }
    )
  },

  // Service / initialisation errors
  serviceNotInitialized(): FusionQuoteError {
    return new FusionQuoteError('Fusion service is not initialized')
  },
  unknownServiceType(serviceType: string): FusionQuoteError {
    return new FusionQuoteError(`Unknown service type: ${serviceType}`)
  },
  cctDependenciesMissing(): FusionQuoteError {
    return new FusionQuoteError(
      'AVALANCHE_CCT enabled but cctDependencies not provided'
    )
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
  // Native token: gas alone exceeds balance (no bridge fee)
  networkFeeExceedsBalance(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Network fee exceeds your balance.\nNetwork fee: ${formattedFee}`,
      { kind: 'network-fee-only' }
    )
  },
  // Native token: gas + bridge fees exceed balance
  feesExceedBalance(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Network and bridge fees exceed your balance.\nRequired fees: ${formattedFee}`
    )
  },
  // Native token: balance covers gas but not gas + swap amount (no bridge fee)
  amountExceedsBalanceAfterNetworkFee(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Insufficient balance to cover the swap amount and network fee.\nNetwork fee: ${formattedFee}`,
      { kind: 'network-fee-only' }
    )
  },
  // Native token: balance covers fees but not fees + swap amount
  amountExceedsBalanceAfterFees(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Insufficient balance to cover the swap amount and fees.\nRequired fees: ${formattedFee}`
    )
  },
  // Non-native token: not enough native balance to pay gas (no bridge fee)
  networkFeeExceedsNativeBalance(
    symbol: string,
    formattedAmount: string
  ): FusionQuoteError {
    return new FusionQuoteError(
      `Network fee exceeds your ${symbol} balance.\nNetwork fee: ${formattedAmount}.`,
      { kind: 'network-fee-only' }
    )
  },
  // Non-native token: not enough native balance to pay gas + bridge fee
  feesExceedNativeBalance(
    symbol: string,
    formattedAmount: string
  ): FusionQuoteError {
    return new FusionQuoteError(
      `Network and bridge fees exceed your ${symbol} balance.\nRequired fees: ${formattedAmount}.`
    )
  },
  // Non-native token: bridge fee alone exceeds token balance
  bridgeFeeExceedsBalance(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Bridge fee exceeds your balance.\nBridge fee: ${formattedFee}`
    )
  },
  // Non-native token: token balance covers the fee but not fee + swap amount
  amountExceedsBalanceAfterBridgeFee(formattedFee: string): FusionQuoteError {
    return new FusionQuoteError(
      `Insufficient balance to cover the swap amount and bridge fee.\nBridge fee: ${formattedFee}`
    )
  },
  // isNativeFeeIssue=true  → native token shortfall (network-fee-only)
  // isNativeFeeIssue=false → token shortfall
  // isNativeFeeIssue=undefined → unknown (e.g. Solana simulation, no cause attached)
  insufficientFundsForFee(
    isNativeFeeIssue: boolean | undefined
  ): FusionQuoteError {
    if (isNativeFeeIssue === true) {
      return new FusionQuoteError(
        'Insufficient native funds to cover the fee',
        {
          kind: 'network-fee-only'
        }
      )
    }
    if (isNativeFeeIssue === false) {
      return new FusionQuoteError(
        'Insufficient token funds to estimate the fee'
      )
    }
    return new FusionQuoteError('Insufficient funds to estimate the fee', {
      kind: 'provider-specific'
    })
  },
  gasEstimationFailed(): FusionQuoteError {
    return new FusionQuoteError('Unable to estimate gas', { isWarning: true })
  },
  swapAmountTooSmall(): FusionQuoteError {
    return new FusionQuoteError(
      'Swap amount is too small for this token pair.\nTry a larger amount.',
      { kind: 'provider-specific' }
    )
  }
}

/**
 * Returns true for errors caused solely by insufficient gas balance (no bridge
 * fee component). These can be downgraded to warnings on networks with gasless
 * support, since the gas fee will be covered outside the user's balance.
 */
export function isGasOnlyNetworkFeeError(error: FusionQuoteError): boolean {
  return error.kind === 'network-fee-only'
}

/**
 * Check if error is user rejection (user cancelled transaction)
 * Don't show error toast for these - user intentionally cancelled
 */
export function isUserRejectionError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  return error.message.toLowerCase().includes('user rejected')
}

// The SDK has updated its error phrasing across versions, so the checkers
// below match both legacy and current substrings to keep the retry/advance
// logic firing.

/**
 * Check if error is gas estimation failure
 * These are retryable with next quote (auto mode only)
 */
export function isGasEstimationError(error: unknown): boolean {
  if (isEstimateNativeFeeError(error)) return true
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('gas estimation') || message.includes('estimate gas')
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

  // CCT swap couldn't resolve the active account's X/P addresses (e.g. a Ledger
  // wallet with no derivable Avalanche address). Surface a clear message instead
  // of the raw internal guard string. See CP-14507.
  if (message.includes(CCT_CALLBACKS_ERROR_TAG)) {
    return "This account isn't set up for cross-chain swaps. Please try a different account."
  }

  // Common error patterns
  if (message.includes('insufficient funds')) {
    return 'Insufficient balance to cover swap amount and fees.'
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
