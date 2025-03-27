import { intervalToDuration } from 'date-fns'

export const formatExportPhraseDuration = (availableAt: number): string => {
  const start = Date.now()
  const end = new Date(availableAt)
  const duration = intervalToDuration({ start, end })
  const totalDay = duration.days || 0
  const totalHours = duration.hours || 0
  const minutes = duration.minutes || 0

  if (totalDay > 0) {
    return `${duration.days} day ${duration.hours} hr`
  }

  return `${totalHours} hr ${minutes} min`
}
