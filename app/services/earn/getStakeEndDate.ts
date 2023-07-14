import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { getMinimumStakeEndDate } from './utils'

export const getStakeEndDate = (
  stakeDurationFormat: StakeDurationFormat,
  stakeDurationValue: number,
  isDeveloperMode: boolean
) => {
  switch (stakeDurationFormat) {
    case StakeDurationFormat.Day:
      return addDays(new Date(), stakeDurationValue)
    case StakeDurationFormat.Week:
      return addWeeks(new Date(), stakeDurationValue)
    case StakeDurationFormat.Month:
      return addMonths(new Date(), stakeDurationValue)
    case StakeDurationFormat.Year:
      return addYears(new Date(), stakeDurationValue)
    case StakeDurationFormat.Custom:
      return getMinimumStakeEndDate(isDeveloperMode)
  }
}

export enum StakeDurationFormat {
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
  Custom = 'Custom'
}

export type DurationOption = {
  title: string
  subTitle: string
  stakeDurationFormat: StakeDurationFormat
  stakeDurationValue: number
}

export const ONE_DAY = {
  title: '1 Day',
  subTitle: 'Estimated Rewards: 0.77 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 1
}

export const TWO_WEEKS = {
  title: '2 Week',
  subTitle: 'Estimated Rewards: 0.77 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Week,
  stakeDurationValue: 2
}

export const ONE_MONTH = {
  title: '1 Month',
  subTitle: 'Estimated Rewards: 1.54 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 1
}

export const THREE_MONTHS = {
  title: '3 Months',
  subTitle: 'Estimated Rewards: 3.54 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 3
}

export const SIX_MONTHS = {
  title: '6 Months',
  subTitle: 'Estimated Rewards: 6.54 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 6
}

export const ONE_YEAR = {
  title: '1 Year',
  subTitle: 'Estimated Rewards: 12.54 AVAX Mocked!!!',
  stakeDurationFormat: StakeDurationFormat.Year,
  stakeDurationValue: 1
}

export const CUSTOM = {
  title: 'Custom',
  subTitle: 'Enter your desired end date',
  stakeDurationFormat: StakeDurationFormat.Custom,
  stakeDurationValue: 14
}

export const DURATION_OPTIONS_MAINNET: DurationOption[] = [
  TWO_WEEKS,
  ONE_MONTH,
  THREE_MONTHS,
  SIX_MONTHS,
  ONE_YEAR,
  CUSTOM
]
export const DURATION_OPTIONS_FUJI: DurationOption[] = [
  ONE_DAY,
  ONE_MONTH,
  THREE_MONTHS,
  SIX_MONTHS,
  ONE_YEAR,
  CUSTOM
]
