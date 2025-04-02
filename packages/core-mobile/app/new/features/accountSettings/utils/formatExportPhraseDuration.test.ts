import { formatExportPhraseDuration } from './formatExportPhraseDuration'

describe('formatExportPhraseDuration', () => {
  it('should format duration correctly for days and hours', () => {
    const availableAt =
      Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000 // 2 days and 3 hours
    const result = formatExportPhraseDuration(availableAt)
    expect(result).toBe('2 day 3 hr')
  })

  it('should format duration correctly for hours and minutes', () => {
    const availableAt = Date.now() + 5 * 60 * 60 * 1000 + 30 * 60 * 1000 // 5 hours and 30 minutes
    const result = formatExportPhraseDuration(availableAt)
    expect(result).toBe('5 hr 30 min')
  })

  it('should handle zero duration correctly', () => {
    const availableAt = Date.now() // Now
    const result = formatExportPhraseDuration(availableAt)
    expect(result).toBe('0 hr 0 min')
  })
})
