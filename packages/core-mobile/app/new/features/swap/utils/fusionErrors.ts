import { isEstimateNativeFeeError, isSdkError } from '@avalabs/fusion-sdk'
import type { QuoterDoneReason } from '@avalabs/fusion-sdk'

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
 * Check if error is a Fusion `TRANSACTION_REVERTED` (errorCode 5006) on the
 * source or target leg. Matches:
 *   - "Source transaction was reverted" (SDK errorReason for source leg)
 *   - "Target transaction was reverted" (SDK errorReason for target leg)
 *   - The numeric `5006` token from `SwapContext.swap`'s
 *     `Transfer failed: ${errorReason ?? errorCode}` rethrow when only the
 *     code is present (no errorReason)
 *
 * Scope intentionally narrow: leaves out generic "transaction was reverted"
 * substrings to avoid catching ERC20 approval reverts, user-rejection
 * phrasings, or unrelated SDK messages.
 *
 * Effective only on synchronously-reverted paths (AVALANCHE_EVM same-chain
 * `waitForTransactionReceipt` returning `reverted`, and Markr ERC20 approval
 * reverts). 5006s surfaced via the post-`source-pending` tracking listener
 * resolve through a different code path and are not retried by this hook.
 */
export function isTransactionRevertedError(error: unknown): boolean {
  if (!(error instanceof Error)) return false

  const message = error.message
  const lower = message.toLowerCase()
  return (
    lower.includes('source transaction was reverted') ||
    lower.includes('target transaction was reverted') ||
    /\b5006\b/.test(message)
  )
}

/**
 * Determine if we should retry with next quote
 * Only retry for specific error types
 */
export function shouldRetryWithNextQuote(error: unknown): boolean {
  return (
    isGasEstimationError(error) ||
    isInvalidResponseError(error) ||
    isTransactionRevertedError(error)
  )
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
  // Fusion errorCode 5006 — most commonly OOG sub-call failures upstream of
  // our gas-margin clamp. The helper handles case-insensitive matching
  // against the same walked error so the SDK's Title-Case
  // "Source transaction was reverted" is recognised.
  if (isTransactionRevertedError(actualError ?? error)) {
    return 'Swap failed on-chain. Please try again with a fresh quote.'
  }

  // Default to original message
  return message
}
