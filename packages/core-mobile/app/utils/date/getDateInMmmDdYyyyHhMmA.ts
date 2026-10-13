import { format } from 'date-fns'

// return date in MMM dd, yyyy, hh:mm a format
export const getDateInMmmDdYyyyHhMmA = (date: number): string => {
  return format(new Date(date * 1000), 'MMM dd, yyyy, hh:mm a')
}
