import { GetCurrentValidatorsResponse } from '@avalabs/avalanchejs-v2/dist/src/vms/pvm'

export type NodeValidator = GetCurrentValidatorsResponse['validators'][0] & {
  delegatorCount?: string
  delegatorWeight?: string
}
export type NodeValidators = NodeValidator[]

export enum AdvancedSortFilter {
  UpTimeHighToLow = 'Uptime: High to Low',
  UpTimeLowToHigh = 'Uptime: Low to High',
  FeeHighToLow = 'Fee: High to Low',
  FeeLowToHigh = 'Fee: Low to High',
  DurationHighToLow = 'Duration: High to Low',
  DurationLowToHigh = 'Duration: Low to High'
}

export type TAdvancedFilterDropDownItems = {
  key: AdvancedSortFilter
  sortByTitle: string
}
