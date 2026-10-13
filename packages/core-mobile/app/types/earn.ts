import type { pvm } from '@avalabs/avalanchejs'

export type NodeValidator =
  pvm.GetCurrentValidatorsResponse['validators'][0] & {
    delegatorCount?: string
    delegatorWeight?: string
  }

export type NodeValidators = NodeValidator[]

/**
 * The flow-neutral subset of a `NodeValidator` consumed by the V2 stake
 * confirm screen. Kept intentionally minimal so any source — the PVM
 * validators list (advanced delegate flow), Glacier's `listValidators`
 * (Fast Stake flow), or future sources — can produce a value that the
 * confirm screen can render without knowing the originating flow.
 *
 * Expressed as a `Pick` over `NodeValidator` so the field names and types
 * stay locked to the canonical PVM shape: adding a field to `NodeValidator`
 * never silently changes `StakeTargetValidator`, and renames propagate
 * through TypeScript instead of drifting.
 */
export type StakeTargetValidator = Pick<
  NodeValidator,
  'nodeID' | 'endTime' | 'delegationFee'
>

export enum AdvancedSortFilter {
  UpTimeHighToLow = 'Uptime: High to Low',
  UpTimeLowToHigh = 'Uptime: Low to High',
  FeeHighToLow = 'Fee: High to Low',
  FeeLowToHigh = 'Fee: Low to High',
  DurationHighToLow = 'Duration: High to Low',
  DurationLowToHigh = 'Duration: Low to High',
  VersionHighToLow = 'Version: High to Low',
  VersionLowToHigh = 'Version: Low to High'
}

export type TAdvancedFilterDropDownItems = {
  key: AdvancedSortFilter
  sortByTitle: string
}

export enum StakeStatus {
  Ongoing = 'Ongoing',
  Completed = 'Completed'
}
