import { createZustandStore } from 'common/utils/createZustandStore'
import { LocalTokenWithBalance } from 'store/balance'

export const useSwapSelectedFromToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useSwapSelectedToToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)
