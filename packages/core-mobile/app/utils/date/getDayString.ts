import {
  endOfToday,
  endOfYesterday,
  format,
  isSameDay,
  isSameYear
} from 'date-fns'

const yesterday = endOfYesterday()
const today = endOfToday()

/**
 *
 * @param timestamp to compare against current date
 * @returns human readable date in string
 * possible return value
 * - Today
 * - Yesterday
 * - if date is within this year, we show month + day. e.g. July 3rd
 * - else we show month + day + year. e.g. July 3rd, 2023
 */
export const getDayString = (
  timestamp: number,
  monthFormat: 'short' | 'long' = 'long'
): string => {
  if (isSameDay(today, timestamp)) return 'Today'
  if (isSameDay(yesterday, timestamp)) return 'Yesterday'
  if (isSameYear(today, timestamp))
    return format(timestamp, `${monthFormat === 'short' ? 'MMM' : 'MMMM'} do`)
  return format(
    timestamp,
    `${monthFormat === 'short' ? 'MMM' : 'MMMM'} d, yyyy`
  )
}
