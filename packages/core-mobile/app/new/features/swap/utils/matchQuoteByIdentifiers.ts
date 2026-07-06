import type { SelectedQuoteIdentifiers } from '../hooks/useZustandStore'
import type { Quote } from '../types'

/**
 * Resolves a stored quote identifier to the matching Quote in allQuotes.
 *
 * Strategy:
 *  1. Exact match by quoteId (stable across non-refreshing updates)
 *  2. Fallback to serviceType + aggregatorId (same provider after the id
 *     rotates from slippage/expiry refreshes)
 *
 * Returns null when identifiers is null or no match exists.
 *
 * Used by SwapContext for both userQuote and autoAdvancedQuote so manual and
 * auto-advanced selections stay sticky across quote refreshes.
 */
export const matchQuoteByIdentifiers = (
  identifiers: SelectedQuoteIdentifiers,
  allQuotes: Quote[]
): Quote | null => {
  if (!identifiers) return null

  const exactMatch = allQuotes.find(q => q.id === identifiers.quoteId)
  if (exactMatch) return exactMatch

  const fallbackMatch = allQuotes.find(
    q =>
      q.serviceType === identifiers.serviceType &&
      q.aggregator.id === identifiers.aggregatorId
  )

  return fallbackMatch ?? null
}
