import {
  endOfToday,
  endOfYesterday,
  format,
  isSameDay,
  isSameYear
} from 'date-fns'

const yesterday = endOfYesterday()
const today = endOfToday()

export const getDayString = (timestamp: number) => {
  // today
  if (isSameDay(today, timestamp)) return 'Today'

  // yesterday
  if (isSameDay(yesterday, timestamp)) return 'Yesterday'

  // if date is within this year, we show month + day
  if (isSameYear(today, timestamp)) return format(timestamp, 'MMMM do')

  // else we show month + day + year
  return format(timestamp, 'MMMM d, yyyy')
}
