import { useEffect, useRef } from 'react'
import { showSnackbar } from 'common/utils/toast'
import Logger from 'utils/Logger'
import { findNextQuote } from '../utils/findNextQuote'
import type { FusionQuoteError } from '../utils/fusionErrors'
import type { Quote } from '../types'

/**
 * When the active quote fails fee validation with a provider-specific error,
 * advance to the next quote in the list. Mirrors core-web's FusionSwapForm
 * behavior so users aren't blocked by a single provider's revert/simulation
 * failure when other quotes are available.
 *
 * Bounded by maxAdvances to avoid churning through every provider on a bad
 * token pair or amount. The counter resets whenever the error clears.
 */
export const useAutoAdvanceOnFeeValidationError = ({
  feeValidationError,
  activeQuote,
  allQuotes,
  selectQuoteById,
  maxAdvances
}: {
  feeValidationError: FusionQuoteError | undefined
  activeQuote: Quote | null
  allQuotes: Quote[]
  selectQuoteById: (quoteId: string | null) => void
  maxAdvances: number
}): void => {
  const advanceCountRef = useRef(0)

  useEffect(() => {
    if (feeValidationError?.kind !== 'provider-specific') {
      // Non-blocking or non-provider-specific error → reset so a fresh run of
      // failures can advance up to maxAdvances again.
      advanceCountRef.current = 0
      return
    }

    if (advanceCountRef.current >= maxAdvances) return
    if (!activeQuote) return

    const nextQuote = findNextQuote(allQuotes, activeQuote.id)
    if (!nextQuote) return

    advanceCountRef.current += 1

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

    selectQuoteById(nextQuote.id)
    showSnackbar('Quote failed gas estimation, trying next available quote')
  }, [feeValidationError, activeQuote, allQuotes, selectQuoteById, maxAdvances])
}
