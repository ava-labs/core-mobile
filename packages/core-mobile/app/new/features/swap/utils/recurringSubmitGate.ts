// Pure submit-gate logic for the swap screen's "Next" button, extracted from
// SwapScreen so the recurring below-minimum guard (the PR's actual fix) is unit
// testable without standing up the whole screen. `FusionQuoteError` is
// structurally assignable to `ValidationErrorLike`, so call sites can pass the
// live `validationError` straight through.

export type ValidationErrorLike = { isWarning?: boolean }

/**
 * A blocking (non-warning) validation error must disable submission, mirroring
 * the one-time `canSwap` gate. Warnings (e.g. gas-estimation) are tolerated.
 *
 * This is what stops a sub-minimum `amountPerOrder` from being submitted: the
 * recurring quote succeeds below the per-order minimum (`useRecurringQuote`
 * only gates on a non-zero amount, and `/recurring/quote` doesn't enforce the
 * minimum), so this gate is the only thing in the way.
 */
export function hasBlockingValidationError(
  validationError: ValidationErrorLike | null
): boolean {
  return validationError !== null && validationError.isWarning !== true
}

export type RecurringSubmitGateParams = {
  isRecurring: boolean
  hasFrequency: boolean
  hasNumberOfOrders: boolean
  hasFromToken: boolean
  hasToToken: boolean
  hasFromTokenValue: boolean
  hasRecurringQuote: boolean
  recurringSubmitting: boolean
  validationError: ValidationErrorLike | null
}

/**
 * The recurring "Next" button is enabled only when the schedule is fully
 * configured (frequency + order count), both tokens and an amount are present,
 * a recurring quote is in hand, no submit is already in flight, and there's no
 * blocking validation error.
 */
export function isRecurringReady(p: RecurringSubmitGateParams): boolean {
  return (
    p.isRecurring &&
    p.hasFrequency &&
    p.hasNumberOfOrders &&
    p.hasFromToken &&
    p.hasToToken &&
    p.hasFromTokenValue &&
    p.hasRecurringQuote &&
    !p.recurringSubmitting &&
    !hasBlockingValidationError(p.validationError)
  )
}

/**
 * The recurring path gates on `isRecurringReady`; the one-time path defers to
 * the existing `canSwap` gate.
 */
export function computeCanSubmit(
  p: RecurringSubmitGateParams & { canSwap: boolean }
): boolean {
  return p.isRecurring ? isRecurringReady(p) : p.canSwap
}
