import { createZustandStore } from 'common/utils/createZustandStore'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'

// Token selection stores
export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

// Quote stores for Fusion Service integration
export const useBestQuote = createZustandStore<Quote | null>(null)
// Store only the selected quote ID, not the entire quote object
// This prevents stale quote data when allQuotes updates with fresh objects
export const useUserSelectedQuoteId = createZustandStore<string | null>(null)
export const useAllQuotes = createZustandStore<Quote[]>([])
