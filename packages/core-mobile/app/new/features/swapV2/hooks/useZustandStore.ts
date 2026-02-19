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

// User's quote selection
export type SelectedQuoteIdentifiers = {
  quoteId: string
  serviceType: string
  aggregatorId: string
} | null

export const useUserSelectedQuote =
  createZustandStore<SelectedQuoteIdentifiers>(null)
export const useAllQuotes = createZustandStore<Quote[]>([])

// Fusion service state
export const useIsFusionServiceReady = createZustandStore<boolean>(false)
