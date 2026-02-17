import { createZustandStore } from 'common/utils/createZustandStore'
import type { LocalTokenWithBalance } from 'store/balance'

// Token selection stores
export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

// Quote stores for Fusion Service integration
// Using generic type to avoid circular dependency with SDK
export const useBestQuote = createZustandStore<unknown | null>(null)
export const useUserQuote = createZustandStore<unknown | null>(null)
export const useAllQuotes = createZustandStore<unknown[]>([])
