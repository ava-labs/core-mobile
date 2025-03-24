import { AdvancedSortFilter, TAdvancedFilterDropDownItems } from 'types/earn'

export const MAX_VALIDATOR_WEIGHT_FACTOR = 5n

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

export const VERSION_HIGH_TO_LOW = {
  key: AdvancedSortFilter.VersionHighToLow,
  sortByTitle: HIGH_TO_LOW
}

export const VERSION_LOW_TO_HIGH = {
  key: AdvancedSortFilter.VersionLowToHigh,
  sortByTitle: LOW_TO_HIGH
}

export const advancedFilterDropDownItems: TAdvancedFilterDropDownItems[] = [
  UP_TIME_HIGH_TO_LOW,
  UP_TIME_LOW_TO_HIGH,
  FEE_HIGH_TO_LOW,
  FEE_LOW_TO_HIGH,
  DURATION_HIGH_TO_LOW,
  DURATION_LOW_TO_HIGH,
  VERSION_HIGH_TO_LOW,
  VERSION_LOW_TO_HIGH
]

export const estimatesTooltipText =
  'Estimates are provided for informational purposes only, without any representation, warranty or guarantee, and do not represent any assurance that you will achieve the same results.'

export const refetchIntervals = {
  balance: __DEV__ ? 30000 : 10000, // 30 seconds in dev mode, 10 seconds in prod mode
  stakes: __DEV__ ? 80000 : 60000 // 80 seconds in dev mode, 60 seconds in prod mode
}
