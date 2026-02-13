import { createZustandStore } from 'common/utils/createZustandStore'
import { DepositAsset, MarketNames } from './types'

export const useDepositSelectedAsset = createZustandStore<
  DepositAsset | undefined
>(undefined)

// Track redirect to borrow flow after deposit completes
// When set, deposit flow will filter by this protocol
export const useRedirectToBorrowAfterDeposit = createZustandStore<
  MarketNames | undefined
>(undefined)
