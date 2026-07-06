import { useEffect, useRef } from 'react'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { findNextQuote } from '../utils/findNextQuote'
import type { FusionQuoteError } from '../utils/fusionErrors'
import type { Quote } from '../types'

/**
 * When the active quote fails fee validation with a provider-specific error,
 * advance to the next quote in the list via advanceBestQuote — which promotes
 * the next quote without flipping the flow into manual-selection mode, so
 * swap-time retry and analytics stay correctly classified as 'auto'.
 *
 * Bounded by maxAdvances to avoid churning through every provider on a bad
 * token pair or amount. The counter resets only on a *stable* clear — when
 * the error is gone AND fee validation isn't mid-flight — or when the user
 * takes manual control via the Pricing sheet.
 *
 * No-op when:
 * - `userQuote` is set — respect the user's explicit pick.
 * - `isSwapping` is true — once the user has committed to a swap, the active
 *   quote must not change underneath the in-flight `transferAsset` call.
 */
export const useAutoAdvanceOnFeeValidationError = ({
  feeValidationError,
  isValidating,
  isSwapping,
  activeQuote,
  allQuotes,
  userQuote,
  advanceBestQuote,
  maxAdvances
}: {
  feeValidationError: FusionQuoteError | undefined
  isValidating: boolean
  isSwapping: boolean
  activeQuote: Quote | null
  allQuotes: Quote[]
  userQuote: Quote | null
  advanceBestQuote: (quoteId: string) => void
  maxAdvances: number
}): void => {
  const advanceCountRef = useRef(0)
  // Tracks the id of the quote we most recently advanced away from. Guards
  // against re-firing when `allQuotes` gets a new array identity from a
  // stream refresh while `activeQuote.id` hasn't changed yet.
  const lastAdvancedFromRef = useRef<string | null>(null)

  useEffect(() => {
    // Swap is in flight — leave activeQuote alone. Otherwise advancing would
    // race the captured quote inside SwapContext.swap() and spam Zustand
    // updates while the JS thread is already busy with the transfer.
    if (isSwapping) return

    // User has manually picked a quote — don't override their choice.
    if (userQuote) {
      advanceCountRef.current = 0
      lastAdvancedFromRef.current = null
      return
    }

    if (feeValidationError?.kind !== 'provider-specific') {
      // While a fee estimation is in flight, `feeValidationError` is briefly
      // undefined — that's not a real "error cleared", it's just a gap. If
      // we reset the counter here, every quote-stream refresh re-arms the
      // budget and the hook can walk the whole list again on each cycle.
      if (isValidating) return

      // Stable clear (validation finished with no error, or the error is
      // non-provider-specific) → arm a fresh budget for the next failure.
      advanceCountRef.current = 0
      lastAdvancedFromRef.current = null
      return
    }

    if (advanceCountRef.current >= maxAdvances) return
    if (!activeQuote) return

    // Already advanced away from this quote — don't re-fire on stream refresh.
    if (lastAdvancedFromRef.current === activeQuote.id) return

    const nextQuote = findNextQuote(allQuotes, activeQuote.id)
    if (!nextQuote) return

    advanceCountRef.current += 1
    lastAdvancedFromRef.current = activeQuote.id

    Logger.error(
      '[useAutoAdvanceOnFeeValidationError] auto-advancing to next quote',
      {
        failed: activeQuote.aggregator.name,
        failedId: activeQuote.id,
        retrying: nextQuote.aggregator.name,
        retryingId: nextQuote.id,
        attempt: advanceCountRef.current,
        maxAdvances,
        errorKind: feeValidationError.kind,
        errorMessage: feeValidationError.message
      }
    )

    advanceBestQuote(nextQuote.id)
    showSnackbar('Quote failed, trying next available')
  }, [
    feeValidationError,
    isValidating,
    isSwapping,
    activeQuote,
    allQuotes,
    userQuote,
    advanceBestQuote,
    maxAdvances
  ])
}
