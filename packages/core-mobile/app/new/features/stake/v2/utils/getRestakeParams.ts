import { PChainTransaction } from '@avalabs/glacier-sdk'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

export interface RestakeParams {
  nodeId: string
  /** Total staked amount in nAVAX (sum of all staked assets, like web). */
  amountNAvax: bigint
  /** Original stake duration, rounded to whole days (mirrors web). */
  durationDays: number
}

/**
 * Derives the parameters a restake re-uses from the original stake tx —
 * the node, the staked amount, and the original duration. Mirrors core-web's
 * `getOnRestake` (`StakingNewTable.tsx`): bail when the tx is missing a
 * node or timestamps, sum every staked asset, and round the duration to
 * whole days. Returns `undefined` when the tx can't seed a restake.
 */
export const getRestakeParams = (
  tx: PChainTransaction
): RestakeParams | undefined => {
  const { nodeId, startTimestamp, endTimestamp } = tx
  if (!nodeId || startTimestamp === undefined || endTimestamp === undefined) {
    return undefined
  }

  const durationDays = Math.round(
    ((endTimestamp - startTimestamp) * 1000) / MILLISECONDS_PER_DAY
  )
  if (durationDays <= 0) return undefined

  const amountNAvax = (tx.amountStaked ?? []).reduce(
    (sum, asset) => sum + BigInt(asset.amount),
    0n
  )
  if (amountNAvax <= 0n) return undefined

  return { nodeId, amountNAvax, durationDays }
}
