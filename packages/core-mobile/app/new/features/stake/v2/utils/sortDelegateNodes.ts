import { TokenUnit } from '@avalabs/core-utils-sdk'
import { NodeValidator } from 'types/earn'

/**
 * Sort options for the Delegate node picker, mirroring core-web's
 * `ValidatorSearchResults` sort menu (and its Glacier `SortByOption`
 * mapping):
 *
 * - Highest APY     → uptime, desc (web proxies APY with uptime performance)
 * - Lowest fee      → delegation fee, asc
 * - Most available  → available delegation capacity, desc
 * - Most trusted    → time remaining (validator end time), desc
 * - Uptime          → uptime, desc
 */
export enum DelegateNodeSortOption {
  HighestApy = 'Highest APY',
  LowestFee = 'Lowest fee',
  MostAvailable = 'Most available',
  MostTrusted = 'Most trusted',
  Uptime = 'Uptime'
}

// Order matches the web sort menu; the first entry is the default.
export const DELEGATE_NODE_SORT_OPTIONS: DelegateNodeSortOption[] = [
  DelegateNodeSortOption.HighestApy,
  DelegateNodeSortOption.LowestFee,
  DelegateNodeSortOption.MostAvailable,
  DelegateNodeSortOption.MostTrusted,
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

export const sortDelegateNodes = (
  nodes: NodeWithAvailable[],
  option: DelegateNodeSortOption
): NodeWithAvailable[] => {
  const sorted = [...nodes]
  switch (option) {
    case DelegateNodeSortOption.LowestFee:
      sorted.sort(
        (a, b) =>
          Number(a.validator.delegationFee) - Number(b.validator.delegationFee)
      )
      break
    case DelegateNodeSortOption.MostAvailable:
      sorted.sort(compareAvailableDesc)
      break
    case DelegateNodeSortOption.MostTrusted:
      sorted.sort(
        (a, b) => Number(b.validator.endTime) - Number(a.validator.endTime)
      )
      break
    case DelegateNodeSortOption.HighestApy:
    case DelegateNodeSortOption.Uptime:
    default:
      sorted.sort(
        (a, b) => Number(b.validator.uptime) - Number(a.validator.uptime)
      )
      break
  }
  return sorted
}
