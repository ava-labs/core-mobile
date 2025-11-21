import { createZustandStore } from 'common/utils/createZustandStore'
import { DefiMarket, DepositAsset } from './types'

export const useDepositSelectedAsset = createZustandStore<
  DepositAsset | undefined
>(undefined)

export const useDepositSelectedMarket = createZustandStore<
  DefiMarket | undefined
>(undefined)
