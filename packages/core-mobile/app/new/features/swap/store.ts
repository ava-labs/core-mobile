import { createZustandStore } from 'common/utils/createZustandStore'
import { LocalTokenWithBalance } from 'store/balance'
import { MarkrQuote } from './types'

export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useAllRates = createZustandStore<
  MarkrQuote[] | undefined
>(undefined)

export const useBestRate = createZustandStore<
  MarkrQuote | undefined
>(undefined)

export const useSelectedSwapRate = createZustandStore<
  MarkrQuote | undefined
>(undefined)