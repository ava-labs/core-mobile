import { format } from 'date-fns'

// return date in MMM dd, yyyy, HH:mm a format
export const getSimpleDateFormat = (date: number): string => {
  return format(new Date(date * 1000), 'MMM dd, yyyy, HH:mm a')
}
