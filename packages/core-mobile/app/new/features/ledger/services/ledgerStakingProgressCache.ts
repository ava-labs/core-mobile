import { createCache } from 'utils/createCache'
import { Operation } from 'services/earn/computeDelegationSteps/types'

export type StakingProgressState = {
  currentStep: number
  currentOperation: Operation | null
}

// a simple in-memory cache (no reactivity or persistence support)
export const ledgerStakingProgressCache = {
  state: createCache<StakingProgressState>('ledger staking progress state')
}
