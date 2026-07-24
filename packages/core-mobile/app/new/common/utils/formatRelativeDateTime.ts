import { format, isSameDay, isYesterday } from 'date-fns'

/**
 * App-wide relative timestamp notation: today → time only, yesterday →
 * "Yesterday" + time, older → MM/dd/yy + time. `separator` joins the date and
 * time parts — newline for two-line trailing labels, " · " for single-line
 * captions.
 */
export const formatRelativeDateTime = (
  timestamp: number,
  separator = '\n'
): string => {
  const date = new Date(timestamp)

  if (isSameDay(date, new Date())) {
    return format(date, 'h:mm a')
  }

  if (isYesterday(date)) {
    return `Yesterday${separator}${format(date, 'h:mm a')}`
  }

  return `${format(date, 'MM/dd/yy')}${separator}${format(date, 'h:mm a')}`
}
