import { NodeValidator } from 'types/earn'

export type NodeTag = 'Recommended' | 'Popular' | 'Reliable' | 'New'

// `Recommended` mirrors the Fast Stake auto-select thresholds
// (`buildFastStakeFilters` in `useFastStakeNode`): uptime ≥ 98% and
// delegation fee ≤ 2%, so a "Recommended" node is one Fast Stake would pick.
const RECOMMENDED_MIN_UPTIME = 98
const RECOMMENDED_MAX_FEE = 2
// A node with a meaningful delegator base is surfaced as "Popular".
const POPULAR_MIN_DELEGATORS = 50
// Near-perfect uptime earns the stronger "Reliable" tag.
const RELIABLE_MIN_UPTIME = 99.999
// Validators that started staking within the last week are "New".
const NEW_WITHIN_DAYS = 7
const SECONDS_PER_DAY = 24 * 60 * 60

/**
 * Derives the marketing tags shown on a validator row in the Delegate node
 * picker. Mirrors core-web's `determineTagsForValidator`
 * (`apps/core/app/components/Stake/utils/determineTagsForValidators.tsx`) so
 * both clients label the same node identically.
 *
 * The PVM validator exposes `uptime`/`delegationFee` as percentage strings,
 * `delegatorCount` as a string, and `startTime` as unix seconds.
 */
export const determineNodeTags = (node: NodeValidator): NodeTag[] => {
  const tags: NodeTag[] = []

  const uptime = Number(node.uptime)
  const delegationFee = Number(node.delegationFee)
  const delegatorCount = Number(node.delegatorCount ?? 0)
  const startTimeSeconds = Number(node.startTime)

  if (
    Number.isFinite(uptime) &&
    uptime >= RECOMMENDED_MIN_UPTIME &&
    Number.isFinite(delegationFee) &&
    delegationFee <= RECOMMENDED_MAX_FEE
  ) {
    tags.push('Recommended')
  }

  if (
    Number.isFinite(delegatorCount) &&
    delegatorCount >= POPULAR_MIN_DELEGATORS
  ) {
    tags.push('Popular')
  }

  if (Number.isFinite(uptime) && uptime >= RELIABLE_MIN_UPTIME) {
    tags.push('Reliable')
  }

  const nowSeconds = Date.now() / 1000
  if (
    Number.isFinite(startTimeSeconds) &&
    nowSeconds - startTimeSeconds < NEW_WITHIN_DAYS * SECONDS_PER_DAY
  ) {
    tags.push('New')
  }

  return tags
}
