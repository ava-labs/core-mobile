import { AdvancedSortFilter, TAdvancedFilterDropDownItems } from 'types/earn'

export const MAX_VALIDATOR_WEIGHT_FACTOR = 5
export const N_AVAX_PER_AVAX = 1_000_000_000

export const HIGH_TO_LOW = 'High to Low'
export const LOW_TO_HIGH = 'Low to High'

export const UP_TIME_HIGH_TO_LOW = {
  key: AdvancedSortFilter.UpTimeHighToLow,
  sortByTitle: HIGH_TO_LOW
}

export const UP_TIME_LOW_TO_HIGH = {
  key: AdvancedSortFilter.UpTimeLowToHigh,
  sortByTitle: LOW_TO_HIGH
}

export const FEE_HIGH_TO_LOW = {
  key: AdvancedSortFilter.FeeHighToLow,
  sortByTitle: HIGH_TO_LOW
}

export const FEE_LOW_TO_HIGH = {
  key: AdvancedSortFilter.FeeLowToHigh,
  sortByTitle: LOW_TO_HIGH
}

export const DURATION_HIGH_TO_LOW = {
  key: AdvancedSortFilter.DurationHighToLow,
  sortByTitle: HIGH_TO_LOW
}

export const DURATION_LOW_TO_HIGH = {
  key: AdvancedSortFilter.DurationLowToHigh,
  sortByTitle: LOW_TO_HIGH
}

export const advancedFilterDropDownItems: TAdvancedFilterDropDownItems[] = [
  UP_TIME_HIGH_TO_LOW,
  UP_TIME_LOW_TO_HIGH,
  FEE_HIGH_TO_LOW,
  FEE_LOW_TO_HIGH,
  DURATION_HIGH_TO_LOW,
  DURATION_LOW_TO_HIGH
]
