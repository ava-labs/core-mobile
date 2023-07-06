import {
  differenceInHours,
  differenceInYears,
  formatDuration,
  intervalToDuration
} from 'date-fns'

export const getReadableDateDuration = (date: Date) => {
  const currentDate = new Date()
  const duration = intervalToDuration({ start: currentDate, end: date })
  let format = ['months', 'days']

  if (differenceInHours(currentDate, date) < 24) {
    format = ['hours', 'minutes']
  }
  if (differenceInYears(currentDate, date) < 1) {
    format = ['months', 'days']
  }
  if (differenceInYears(currentDate, date) > 1) {
    format = ['years', 'months']
  }
  return formatDuration(duration, { format })
}
