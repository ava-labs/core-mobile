import { intervalToDuration } from 'date-fns'

export const formatExportPhraseDuration = (date: Date): string => {
  const start = new Date(0)
  const duration = intervalToDuration({ start, end: date })

  const totalDay = duration.days || 0
  const totalHours = duration.hours || 0
  const minutes = duration.minutes || 0

  if (totalDay > 0) {
    return `${duration.days} day ${duration.hours}hr`
  }

  return `${totalHours}hr ${minutes}min`
}
