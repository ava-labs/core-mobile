import {
  addDays,
  addHours,
  addMonths,
  addWeeks,
  addYears,
  fromUnixTime,
  getUnixTime,
  subHours
} from 'date-fns'
import { UnixTime, UnixTimeMs } from 'services/earn/types'
import { utc } from '@date-fns/utc/utc'
import { UTCDate } from '@date-fns/utc'
import { getMinimumStakeEndTime } from './utils'

const DAYS_IN_YEAR = 365

export const getStakeEndDate = ({
  startDateUnix,
  stakeDurationFormat,
  stakeDurationValue,
  isDeveloperMode
}: {
  startDateUnix: UnixTime
  stakeDurationFormat: StakeDurationFormat
  stakeDurationValue: number
  isDeveloperMode: boolean
}): UnixTime => {
  const currentDate = fromUnixTime(startDateUnix, { in: utc })
  switch (stakeDurationFormat) {
    case StakeDurationFormat.Day: {
      // Web parity (`StakingFastStake.page` / `DelegationForm`): day-based
      // end times carry +1h of slack so the submit-time re-anchored start
      // (now + 1 min) can't round the realized duration below the selected
      // number of days (CP-14723). The 365-day preset instead backs off 1h:
      // the protocol maximum end (now + 1 calendar year) equals exactly 365
      // days outside leap years, so +1h would overshoot it.
      const end = addDays(currentDate, stakeDurationValue)
      return getUnixTime(
        stakeDurationValue === DAYS_IN_YEAR
          ? subHours(end, 1)
          : addHours(end, 1)
      )
    }
    case StakeDurationFormat.Week:
      return getUnixTime(addWeeks(currentDate, stakeDurationValue))
    case StakeDurationFormat.Month:
      return getUnixTime(addMonths(currentDate, stakeDurationValue))
    case StakeDurationFormat.Year:
      return getUnixTime(addYears(currentDate, stakeDurationValue))
    case StakeDurationFormat.Custom:
      return getUnixTime(getMinimumStakeEndTime(isDeveloperMode, currentDate))
  }
}
export const getStakeDuration = (
  stakeDurationFormat: StakeDurationFormat,
  stakeDurationValue: number,
  isDeveloperMode: boolean
): UnixTimeMs => {
  const currentTime = new UTCDate()
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
  NODE_MAX = 'Node Max',
  CUSTOM = 'Custom'
}

export type DurationOption =
  | {
      title: Exclude<StakeDurationTitle, StakeDurationTitle.CUSTOM>
      numberOfDays: number
      stakeDurationFormat: StakeDurationFormat
      stakeDurationValue: number
    }
  | {
      title: StakeDurationTitle.CUSTOM
      stakeDurationFormat: StakeDurationFormat
      stakeDurationValue: number
    }

export const ONE_DAY = {
  title: StakeDurationTitle.ONE_DAY,
  numberOfDays: 1,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 1
} as const

// The preset durations are defined in WHOLE DAYS (web parity — see
// core-web's `stakePeriods.ts` `MAINNET_PERIOD_DAYS`): the calendar titles
// are labels only, and `stakeDurationValue` must equal `numberOfDays`.
// They used to be calendar-based (`addMonths(6)` etc.), which made a
// "6 Months / 180 days" selection produce a 181-184 day stake (CP-14723).
export const TWO_WEEKS = {
  title: StakeDurationTitle.TWO_WEEKS,
  numberOfDays: 14,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 14
} as const

export const ONE_MONTH = {
  title: StakeDurationTitle.ONE_MONTH,
  numberOfDays: 30,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 30
} as const

export const THREE_MONTHS = {
  title: StakeDurationTitle.THREE_MONTHS,
  numberOfDays: 90,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 90
} as const

export const SIX_MONTHS = {
  title: StakeDurationTitle.SIX_MONTHS,
  numberOfDays: 180,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 180
} as const

export const ONE_YEAR = {
  title: StakeDurationTitle.ONE_YEAR,
  numberOfDays: 365,
  stakeDurationFormat: StakeDurationFormat.Day,
  stakeDurationValue: 365
} as const

export const CUSTOM = {
  title: StakeDurationTitle.CUSTOM,
  stakeDurationFormat: StakeDurationFormat.Custom,
  stakeDurationValue: 14
} as const

export const DURATION_OPTIONS_WITH_DAYS_MAINNET: DurationOptionWithDays[] = [
  TWO_WEEKS,
  ONE_MONTH,
  THREE_MONTHS,
  SIX_MONTHS,
  ONE_YEAR
]
export const DURATION_OPTIONS_WITH_DAYS_FUJI: DurationOptionWithDays[] = [
  ONE_DAY,
  ONE_MONTH,
  THREE_MONTHS,
  SIX_MONTHS,
  ONE_YEAR
]

export const DURATION_OPTIONS_MAINNET: DurationOption[] = [
  ...DURATION_OPTIONS_WITH_DAYS_MAINNET,
  CUSTOM
]
export const DURATION_OPTIONS_FUJI: DurationOption[] = [
  ...DURATION_OPTIONS_WITH_DAYS_FUJI,
  CUSTOM
]

/**
 * Replaces the 1 Year preset with a "Node max" option running until the
 * selected validator's end time (CP-14775, matching web). Delegation
 * flow only — it is the one flow where a node is picked before the duration.
 * Two motivations: a full 365 days is never actually stakeable (validators
 * have at most 365 days minus the minutes since they were accepted), and
 * when the node ends sooner than the longer presets this is the only
 * one-tap way to stake the maximum without entering a custom date.
 *
 * `numberOfDays` drives the card label and the reward estimate; the duration
 * screen resolves the actual end timestamp from the node itself so the stake
 * ends exactly at the validator's end time, not at a rounded day count.
 */
export const withNodeMaxOption = (
  options: DurationOptionWithDays[],
  nodeEndDays: number
): DurationOptionWithDays[] =>
  options.map(option =>
    option.title === StakeDurationTitle.ONE_YEAR
      ? {
          title: StakeDurationTitle.NODE_MAX,
          numberOfDays: nodeEndDays,
          stakeDurationFormat: StakeDurationFormat.Day,
          stakeDurationValue: nodeEndDays
        }
      : option
  )

export type DurationOptionWithDays = Extract<
  DurationOption,
  { numberOfDays: number }
>
