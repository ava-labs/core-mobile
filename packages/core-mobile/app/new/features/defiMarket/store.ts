import { createZustandStore } from 'common/utils/createZustandStore'
import { DepositAsset } from './types'

export const useDepositSelectedAsset = createZustandStore<
  DepositAsset | undefined
>(undefined)
