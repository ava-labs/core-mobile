import {
  AdvancedSortFilter,
  TAdvancedFilterDropDownItems
} from 'types/earn.types'

export const HIGH_TO_LOW = 'High to Low'
export const LOW_TO_HIGH = 'Low to High'

export const advancedFilterDropDownItems: TAdvancedFilterDropDownItems[] = [
  { key: AdvancedSortFilter.UpTimeHighToLow, sortByTitle: HIGH_TO_LOW },
  { key: AdvancedSortFilter.UpTimeLowToHigh, sortByTitle: LOW_TO_HIGH },
  { key: AdvancedSortFilter.FeeHighToLow, sortByTitle: HIGH_TO_LOW },
  { key: AdvancedSortFilter.FeeLowToHigh, sortByTitle: LOW_TO_HIGH },
  { key: AdvancedSortFilter.DurationHighToLow, sortByTitle: HIGH_TO_LOW },
  { key: AdvancedSortFilter.DurationLowToHigh, sortByTitle: LOW_TO_HIGH }
]
