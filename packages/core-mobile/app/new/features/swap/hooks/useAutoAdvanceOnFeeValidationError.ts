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
 * token pair or amount. The counter resets whenever the error clears or the
 * user takes manual control via the Pricing sheet.
 *
 * No-op when userQuote is set — respect the user's explicit pick.
 */
export const useAutoAdvanceOnFeeValidationError = ({
  feeValidationError,
  activeQuote,
  allQuotes,
  userQuote,
  advanceBestQuote,
  maxAdvances
}: {
  feeValidationError: FusionQuoteError | undefined
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
    // User has manually picked a quote — don't override their choice.
    if (userQuote) {
      advanceCountRef.current = 0
      lastAdvancedFromRef.current = null
      return
    }

    if (feeValidationError?.kind !== 'provider-specific') {
      // Non-blocking or non-provider-specific error → reset so a fresh run of
      // failures can advance up to maxAdvances again.
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
    showSnackbar('Quote failed fee validation, trying next available quote')
  }, [
    feeValidationError,
    activeQuote,
    allQuotes,
    userQuote,
    advanceBestQuote,
    maxAdvances
  ])
}
