import { createZustandStore } from 'common/utils/createZustandStore'
import { DepositAsset } from './types'

export const useDepositSelectedAsset = createZustandStore<
  DepositAsset | undefined
>(undefined)

// Track if we should redirect to borrow flow after deposit completes
export const useRedirectToBorrowAfterDeposit =
  createZustandStore<boolean>(false)
