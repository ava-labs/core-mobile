import { createCache } from 'utils/createCache'
import { Operation } from 'services/earn/computeDelegationSteps/types'

export type LedgerStakingProgressParams = {
  totalSteps: number
  onComplete: () => void
  onCancel: () => void
}

export type StakingProgressState = {
  currentStep: number
  currentOperation: Operation | null
}

// a simple in-memory cache (no reactivity or persistence support)
export const ledgerStakingProgressCache = {
  params: createCache<LedgerStakingProgressParams>('ledger staking progress'),
  state: createCache<StakingProgressState>('ledger staking progress state')
}

