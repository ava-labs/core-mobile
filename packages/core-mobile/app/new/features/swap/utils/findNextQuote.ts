import type { Quote } from '../types'

/**
 * Returns the quote immediately following the one with the given id, or
 * undefined if the current id isn't found or it's already the last quote.
 *
 * Used by both the pre-swap auto-advance on fee-validation errors and the
 * swap-time retry in SwapContext, so both paths walk the quote list the same
 * way.
 */
export const findNextQuote = (
  allQuotes: Quote[],
  currentId: string
): Quote | undefined => {
  const currentIndex = allQuotes.findIndex(q => q.id === currentId)
  if (currentIndex < 0) return undefined
  return allQuotes[currentIndex + 1]
}
