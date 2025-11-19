import { createZustandStore } from 'common/utils/createZustandStore'
import { LocalTokenWithBalance } from 'store/balance'
import { DefiMarket } from './types'

export const useDepositSelectedToken = createZustandStore<
  LocalTokenWithBalance | undefined
>(undefined)

export const useDepositSelectedMarket = createZustandStore<
  DefiMarket | undefined
>(undefined)
