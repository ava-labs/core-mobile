import { TokenUnit } from '@avalabs/core-utils-sdk'
import { NodeValidator } from 'types/earn'

/**
 * Sort options for the Delegate node picker, matching core-web's
 * `ValidatorSearchResults` sort menu (and its Glacier `SortByOption`
 * mapping) one-to-one:
 *
 * - Lowest fee      → delegation fee, asc (default — matches web)
 * - Most available  → available delegation capacity, desc
 * - Time remaining  → validator end time, desc
 * - Uptime          → uptime, desc
 */
export enum DelegateNodeSortOption {
  LowestFee = 'Lowest fee',
  MostAvailable = 'Most available',
  TimeRemaining = 'Time remaining',
  Uptime = 'Uptime'
}

// Order matches the web sort menu; the first entry is the default.
export const DELEGATE_NODE_SORT_OPTIONS: DelegateNodeSortOption[] = [
  DelegateNodeSortOption.LowestFee,
  DelegateNodeSortOption.MostAvailable,
  DelegateNodeSortOption.TimeRemaining,
  DelegateNodeSortOption.Uptime
]

/**
 * A validator paired with its precomputed available delegation weight so the
 * "Most available" sort doesn't recompute it inside the comparator.
 */
export type NodeWithAvailable = {
  validator: NodeValidator
  available: TokenUnit
}

const compareAvailableDesc = (
  a: NodeWithAvailable,
  b: NodeWithAvailable
): number => {
  if (a.available.lt(b.available)) return 1
  if (a.available.gt(b.available)) return -1
  return 0
}

// Longer remaining stake time (later end date) first.
const compareTimeRemainingDesc = (
  a: NodeWithAvailable,
  b: NodeWithAvailable
): number => Number(b.validator.endTime) - Number(a.validator.endTime)

/**
 * Shared tie-breaker: most stake time remaining first. After the default
 * `maxFee ≤ 2%` filter, nearly every node sits at the network-minimum 2% fee,
 * so a "Lowest fee" sort leaves a large tie. We fetch validators from the
 * P-Chain RPC (raw, start-order — i.e. oldest/near-expiry first) and sort
 * client-side, whereas core-web sorts server-side via Glacier; without a
 * tie-breaker that source ordering surfaced near-expiry nodes at the top.
 * Breaking ties by time remaining keeps long-lived validators on top, matching
 * what web shows.
 */
const withTimeRemainingTieBreak =
  (primary: (a: NodeWithAvailable, b: NodeWithAvailable) => number) =>
  (a: NodeWithAvailable, b: NodeWithAvailable): number =>
    primary(a, b) || compareTimeRemainingDesc(a, b)

const compareFeeAsc = (a: NodeWithAvailable, b: NodeWithAvailable): number =>
  Number(a.validator.delegationFee) - Number(b.validator.delegationFee)

const compareUptimeDesc = (
  a: NodeWithAvailable,
  b: NodeWithAvailable
): number => Number(b.validator.uptime) - Number(a.validator.uptime)

export const sortDelegateNodes = (
  nodes: NodeWithAvailable[],
  option: DelegateNodeSortOption
): NodeWithAvailable[] => {
  const sorted = [...nodes]
  switch (option) {
    case DelegateNodeSortOption.MostAvailable:
      sorted.sort(withTimeRemainingTieBreak(compareAvailableDesc))
      break
    case DelegateNodeSortOption.TimeRemaining:
      sorted.sort(compareTimeRemainingDesc)
      break
    case DelegateNodeSortOption.Uptime:
      sorted.sort(withTimeRemainingTieBreak(compareUptimeDesc))
      break
    case DelegateNodeSortOption.LowestFee:
    default:
      sorted.sort(withTimeRemainingTieBreak(compareFeeAsc))
      break
  }
  return sorted
}
