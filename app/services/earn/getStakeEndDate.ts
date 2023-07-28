import { addDays, addMonths, addWeeks, addYears } from 'date-fns'
import { UnixTimeMs } from 'services/earn/types'
import { getMinimumStakeEndTime } from './utils'

export const getStakeEndDate = (
  curentDate: Date,
  stakeDurationFormat: StakeDurationFormat,
  stakeDurationValue: number,
  isDeveloperMode: boolean
) => {
  switch (stakeDurationFormat) {
    case StakeDurationFormat.Day:
      return addDays(curentDate, stakeDurationValue)
    case StakeDurationFormat.Week:
      return addWeeks(curentDate, stakeDurationValue)
    case StakeDurationFormat.Month:
      return addMonths(curentDate, stakeDurationValue)
    case StakeDurationFormat.Year:
      return addYears(curentDate, stakeDurationValue)
    case StakeDurationFormat.Custom:
      return getMinimumStakeEndTime(isDeveloperMode, curentDate)
  }
}
export const getStakeDuration = (
  stakeDurationFormat: StakeDurationFormat,
  stakeDurationValue: number,
  isDeveloperMode: boolean
): UnixTimeMs => {
  const currentTime = new Date()
  const currentTimeUnix = currentTime.getTime()
  switch (stakeDurationFormat) {
    case StakeDurationFormat.Day:
      return (
        addDays(currentTime, stakeDurationValue).getTime() - currentTimeUnix
      )
    case StakeDurationFormat.Week:
      return (
        addWeeks(currentTime, stakeDurationValue).getTime() - currentTimeUnix
      )
    case StakeDurationFormat.Month:
      return (
        addMonths(currentTime, stakeDurationValue).getTime() - currentTimeUnix
      )
    case StakeDurationFormat.Year:
      return (
        addYears(currentTime, stakeDurationValue).getTime() - currentTimeUnix
      )
    case StakeDurationFormat.Custom:
      return (
        getMinimumStakeEndTime(isDeveloperMode, currentTime).getTime() -
        currentTimeUnix
      )
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
