import { Network } from '@avalabs/core-chains-sdk'
import { createCache } from 'utils/createCache'
import { Operation } from 'services/earn/computeDelegationSteps/types'

export type StakingProgressParams = {
  totalSteps: number
  onProgress?: (step: number, operation: Operation | null) => void
  onComplete: () => void
  onCancel: () => void
}

export type LedgerReviewTransactionParams = {
  network: Network
  onApprove: () => Promise<void>
  onReject: (message?: string) => void
  // Optional staking progress fields for unified modal
  stakingProgress?: StakingProgressParams
}

// a simple in-memory cache (no reactivity or persistence support)
export const ledgerParamsCache = {
  ledgerReviewTransactionParams: createCache<LedgerReviewTransactionParams>(
    'ledger review transaction'
  )
}
