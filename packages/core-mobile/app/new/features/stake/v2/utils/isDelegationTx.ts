import { PChainTransaction, PChainTransactionType } from '@avalabs/glacier-sdk'

// Mirrors core-web's `DELEGATION_TYPES`
// (apps/core/app/components/StakingPage/utils.ts) so both clients classify
// the same transactions as delegations.
const DELEGATION_TX_TYPES = new Set<PChainTransactionType>([
  PChainTransactionType.ADD_DELEGATOR_TX,
  PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX
])

/**
 * Whether the P-Chain transaction is a delegation (as opposed to a
 * validation). Used to label fee-less stakes: Fast Stake detection
 * (`isFastStakeTx`) relies on the convenience-fee escrow output, so plain
 * delegations need this txType-based fallback.
 */
export const isDelegationTx = (tx: PChainTransaction): boolean =>
  DELEGATION_TX_TYPES.has(tx.txType)
