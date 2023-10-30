import {
  differenceInHours,
  differenceInYears,
  formatDuration,
  intervalToDuration
} from 'date-fns'

/**
 *
 * @param date in the future to compare against current date
 * @returns duration in different format that is more readable
 * e.g. 2 months 3 days | 10 hours 50 minutes | 2 years 5 months
 */
export const getReadableDateDuration = (date: Date) => {
  const currentDate = new Date()
  const duration = intervalToDuration({ start: currentDate, end: date })
  let format = ['months', 'days']

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
