import {
  differenceInHours,
  differenceInYears,
  DurationUnit,
  formatDuration,
  intervalToDuration,
  differenceInDays
} from 'date-fns'
import { UTCDate } from '@date-fns/utc'

/**
 *
 * @param date in the future to compare against current date
 * @returns duration in different format that is more readable
 * e.g. 2 months 3 days | 10 hours 50 minutes | 2 years 5 months
 */
export const getReadableDateDuration = (date: UTCDate): string => {
  const currentDate = new UTCDate()
  const duration = intervalToDuration({ start: currentDate, end: date })
  let format: DurationUnit[] = ['months', 'days']

  if (differenceInYears(date, currentDate) > 1) {
    format = ['years', 'months']
  }
  if (differenceInYears(date, currentDate) < 1) {
    format = ['months', 'days']
  }
  if (differenceInHours(date, currentDate) < 24) {
    format = ['hours', 'minutes']
  }
  return formatDuration(duration, { format })
}

export const getDateDurationInDays = (date: Date, now?: Date): number => {
  const currentDate = now ?? new Date()
  return differenceInDays(date, currentDate)
}
