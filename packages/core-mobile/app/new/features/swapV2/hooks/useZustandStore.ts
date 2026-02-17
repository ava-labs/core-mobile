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
export const useUserQuote = createZustandStore<Quote | null>(null)
export const useAllQuotes = createZustandStore<Quote[]>([])
