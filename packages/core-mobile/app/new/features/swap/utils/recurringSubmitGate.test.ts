import {
  hasBlockingValidationError,
  isRecurringReady,
  computeCanSubmit,
  type RecurringSubmitGateParams
} from './recurringSubmitGate'

// A fully-configured, quote-in-hand recurring schedule with no validation
// error — the baseline "ready" state. Individual tests flip one field to prove
// it gates submission.
const READY: RecurringSubmitGateParams = {
  isRecurring: true,
  hasFrequency: true,
  hasNumberOfOrders: true,
  hasFromToken: true,
  hasToToken: true,
  hasFromTokenValue: true,
  hasRecurringQuote: true,
  recurringSubmitting: false,
  validationError: null,
  isRecurringMinimumReady: true,
  hasRecurringFees: true
}

describe('hasBlockingValidationError', () => {
  it('is false when there is no validation error', () => {
    expect(hasBlockingValidationError(null)).toBe(false)
  })

  it('is false for a warning-only error', () => {
    expect(hasBlockingValidationError({ isWarning: true })).toBe(false)
  })

  it('is true for a blocking (non-warning) error', () => {
    // Below-minimum / exceeds-balance / enter-amount all surface as
    // non-warning FusionQuoteErrors.
    expect(hasBlockingValidationError({})).toBe(true)
    expect(hasBlockingValidationError({ isWarning: false })).toBe(true)
  })
})

describe('isRecurringReady', () => {
  it('is true for a fully-configured schedule with no blocking error', () => {
    expect(isRecurringReady(READY)).toBe(true)
  })

  // The reviewer's core ask: a blocking validation error (e.g. sub-minimum
  // amountPerOrder) must disable submission even though the recurring quote
  // itself succeeded below the minimum.
  it('is false when a blocking validation error is present', () => {
    expect(isRecurringReady({ ...READY, validationError: {} })).toBe(false)
    expect(
      isRecurringReady({ ...READY, validationError: { isWarning: false } })
    ).toBe(false)
  })

  // The other half of the ask: a warning-only error still submits.
  it('stays ready when the validation error is warning-only', () => {
    expect(
      isRecurringReady({ ...READY, validationError: { isWarning: true } })
    ).toBe(true)
  })

  it.each<keyof RecurringSubmitGateParams>([
    'isRecurring',
    'hasFrequency',
    'hasNumberOfOrders',
    'hasFromToken',
    'hasToToken',
    'hasFromTokenValue',
    'hasRecurringQuote'
  ])('is false when %s is missing', field => {
    expect(isRecurringReady({ ...READY, [field]: false })).toBe(false)
  })

  it('is false while a submit is already in flight', () => {
    expect(isRecurringReady({ ...READY, recurringSubmitting: true })).toBe(
      false
    )
  })

  // Race guard: the recurring quote can resolve before the Markr per-order
  // minimum query settles. While the minimum is unknown the below-minimum
  // validation check is skipped, so readiness must stay false until it settles
  // — otherwise a quick tap could submit a sub-minimum per-order amount.
  it('is false while the Markr minimum query has not settled', () => {
    expect(isRecurringReady({ ...READY, isRecurringMinimumReady: false })).toBe(
      false
    )
  })

  it('is ready once the minimum query has settled (even with no floor)', () => {
    // A settled "no minimum" (null) still counts as ready — the flag only
    // tracks that the query is no longer in flight.
    expect(isRecurringReady({ ...READY, isRecurringMinimumReady: true })).toBe(
      true
    )
  })

  // Cold-start fee guard: `recurringGasSettings` starts fee-less until live
  // `networkFees` load. Submitting fee-less trips signBatch's guard and, on the
  // software-wallet path (fallback disabled), hard-fails the whole swap — so
  // readiness must stay false until the EIP-1559 override is filled. (CP-14641)
  it('is false while the recurring batch gas fees are not yet filled', () => {
    expect(isRecurringReady({ ...READY, hasRecurringFees: false })).toBe(false)
  })
})

describe('computeCanSubmit', () => {
  it('uses the recurring gate when isRecurring is true (blocks on a real error)', () => {
    expect(computeCanSubmit({ ...READY, canSwap: false })).toBe(true)
    expect(
      computeCanSubmit({ ...READY, validationError: {}, canSwap: true })
    ).toBe(false)
  })

  it('defers to canSwap on the one-time path (ignores recurring fields)', () => {
    const oneTime = { ...READY, isRecurring: false }
    // Recurring fields are irrelevant when isRecurring is false — even a
    // blocking validationError doesn't matter; canSwap is the sole gate.
    expect(
      computeCanSubmit({ ...oneTime, validationError: {}, canSwap: true })
    ).toBe(true)
    expect(computeCanSubmit({ ...oneTime, canSwap: false })).toBe(false)
  })
})
