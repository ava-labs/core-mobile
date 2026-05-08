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

/**
 * Allowlist of contract revert reasons that represent expected user state
 * (insufficient balance, insufficient allowance) rather than SDK or contract
 * bugs. Each entry was sourced from the cross-platform investigation by
 * inspecting the corresponding contract source — anything balance- or
 * allowance-related is user state. Bug-class reverts (`TargetCallFailed`,
 * `Panic`, `UnsupportedTokenOut`) are deliberately excluded so they continue
 * to fire Sentry events.
 */
const USER_STATE_REVERT_REASONS: readonly string[] = [
  'ERC20: transfer amount exceeds balance',
  'ERC20: transfer amount exceeds allowance',
  'TRANSFER_AMOUNT_EXCEEDS_ALLOWANCE',
  'Png::transferFrom',
  'ERC20: burn amount exceeds balance'
]

/**
 * Returns true when `error` represents an expected user-state rejection
 * (insufficient native funds, insufficient ERC20 balance/allowance) rather
 * than an SDK or contract bug. The Sentry capture path in `useFeeEstimation`
 * skips capture when this returns true — the user already gets an inline
 * validation error via `useFeeValidation → canSwap`, so Sentry doesn't add
 * value here and the noise pollutes the issue list.
 *
 * Fails open: returns false for unknown shapes so we never silence something
 * we haven't classified.
 */
export const isUserStateError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') return false

  // Raw RPC -32000 insufficient funds (the un-wrapped path that lands in 9X6).
  // Coerce `code` via Number() because some RPC providers emit it as a string.
  if (
    'code' in error &&
    Number(error.code) === -32000 &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message.includes('insufficient funds')
  ) {
    return true
  }

  // SDK wrapper helper for insufficient-funds-causing errors. Wrapped in
  // try/catch because the SDK helper is invoked on a foreign object and a
  // future SDK regression could throw — we'd rather fall through and capture
  // the error than let the helper take down the useEffect.
  try {
    if (
      'causedByInsufficientFunds' in error &&
      typeof error.causedByInsufficientFunds === 'function' &&
      error.causedByInsufficientFunds() === true
    ) {
      return true
    }
  } catch {
    // Helper threw; fall through to the next matcher. If nothing else matches
    // we return false and the caller captures as before.
  }

  // Allowlisted contract revert reasons surfaced through the SDK's
  // EstimateNativeFeeError → cause chain.
  if (
    'details' in error &&
    error.details &&
    typeof error.details === 'object' &&
    'cause' in error.details &&
    error.details.cause &&
    typeof error.details.cause === 'object' &&
    'shortMessage' in error.details.cause &&
    typeof error.details.cause.shortMessage === 'string'
  ) {
    const msg = error.details.cause.shortMessage
    return USER_STATE_REVERT_REASONS.some(reason => msg.includes(reason))
  }

  return false
}
