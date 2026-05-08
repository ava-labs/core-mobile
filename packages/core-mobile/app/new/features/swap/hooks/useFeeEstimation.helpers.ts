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
