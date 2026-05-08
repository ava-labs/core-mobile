import type { Quote } from '../types'

/**
 * Type guard mirroring the SDK's expired-quote check from
 * `transferManager.estimateNativeFee`: the SDK throws
 * `InvalidParamsError(QUOTE_EXPIRED)` when
 * `quote.expiresAt <= Math.floor(Date.now() / 1000)`. Use this guard before
 * calling `FusionService.estimateNativeFee` so we skip the round-trip entirely
 * for stale quotes. The narrowing form lets callers use the narrowed `Quote`
 * inside the truthy branch without a non-null assertion.
 */
export const isQuoteUsable = (quote: Quote | null): quote is Quote => {
  if (!quote) return false
  const now = Math.floor(Date.now() / 1000)
  return quote.expiresAt > now
}

/**
 * Builds a Sentry fingerprint for fee-estimation errors that propagated through
 * the SDK's EstimateNativeFeeError wrap. The on-chain revert signature
 * (`error.details.data`, a 4-byte selector) discriminates between distinct
 * contract revert reasons (e.g. TargetCallFailed `0xeda86850`,
 * FailedInnerCall `0x1425ea42`, UnsupportedTokenOut, ERC20 transfer-amount
 * errors, etc.) so each surfaces as its own Sentry issue instead of being
 * collapsed into A8W's umbrella.
 *
 * When `details.data` is missing the fingerprint falls back to Sentry's
 * `{{ default }}` token so events are still grouped by stack — without this
 * fallback, calling `setFingerprint` would replace the default grouping and
 * collapse every detail-less event into a single issue.
 */
export const getFingerprintForFeeEstimationError = (
  error: unknown
): string[] => {
  if (
    error &&
    typeof error === 'object' &&
    'details' in error &&
    error.details &&
    typeof error.details === 'object' &&
    'data' in error.details &&
    typeof error.details.data === 'string'
  ) {
    return ['useFeeEstimation', error.details.data]
  }
  return ['{{ default }}']
}
