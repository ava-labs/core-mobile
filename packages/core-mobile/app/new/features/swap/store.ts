import { createZustandStore } from 'common/utils/createZustandStore'
import { LocalTokenWithBalance } from 'store/balance'
import { NormalizedSwapQuoteResult } from './types'

export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useQuotes = createZustandStore<
  NormalizedSwapQuoteResult | undefined
>(undefined)

export const useManuallySelected = createZustandStore<boolean>(false)
