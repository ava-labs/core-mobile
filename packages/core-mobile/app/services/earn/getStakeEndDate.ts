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

export enum StakeDurationTitle {
  ONE_DAY = '1 Day',
  TWO_WEEKS = '2 Weeks',
  ONE_MONTH = '1 Month',
  THREE_MONTHS = '3 Months',
  SIX_MONTHS = '6 Months',
  ONE_YEAR = '1 Year',
  CUSTOM = 'Custom'
}

export type DurationOption = {
  title: string
  stakeDurationFormat: StakeDurationFormat
  stakeDurationValue: number
}

export const ONE_DAY = {
  title: StakeDurationTitle.ONE_DAY,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 1
}

export const TWO_WEEKS = {
  title: StakeDurationTitle.TWO_WEEKS,
  stakeDurationFormat: StakeDurationFormat.Week,
  stakeDurationValue: 2
}

export const ONE_MONTH = {
  title: StakeDurationTitle.ONE_MONTH,
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 1
}

export const THREE_MONTHS = {
  title: StakeDurationTitle.THREE_MONTHS,
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 3
}

export const SIX_MONTHS = {
  title: StakeDurationTitle.SIX_MONTHS,
  stakeDurationFormat: StakeDurationFormat.Month,
  stakeDurationValue: 6
}

export const ONE_YEAR = {
  title: StakeDurationTitle.ONE_YEAR,
  stakeDurationFormat: StakeDurationFormat.Year,
  stakeDurationValue: 1
}

export const CUSTOM = {
  title: StakeDurationTitle.CUSTOM,
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
