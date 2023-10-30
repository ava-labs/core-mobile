import { formatDistance } from 'date-fns'

export const getFormattedDistance = (
  seconds: number,
  includeSeconds?: boolean
): string => {
  return formatDistance(0, seconds * 1000, { includeSeconds })
}
