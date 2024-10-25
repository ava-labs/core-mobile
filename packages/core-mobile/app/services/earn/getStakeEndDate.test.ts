import { fromUnixTime, addDays, getUnixTime } from 'date-fns'
import {
  getStakeEndDate,
  StakeDurationFormat
} from 'services/earn/getStakeEndDate'
import { getMinimumStakeEndTime } from 'services/earn/utils'

// Mocking the getMinimumStakeEndTime function
jest.mock('services/earn/utils', () => ({
  getMinimumStakeEndTime: jest.fn()
}))

describe('getStakeEndDate', () => {
  const startDateUnix = 1729807200 // Thu Oct 24 2024 22:00:00 UTC
  const currentDate = fromUnixTime(startDateUnix) // Date representation in UTC

  it('calculates end date in days', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Day,
      stakeDurationValue: 1,
      isDeveloperMode: false
    })
    expect(result).toBe(startDateUnix + 24 * 60 * 60) // Thu Oct 25 2024 22:00:00 UTC
  })

  it('calculates end date in weeks', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Week,
      stakeDurationValue: 2,
      isDeveloperMode: false
    })
    expect(result).toBe(startDateUnix + 2 * 7 * 24 * 60 * 60) //Thu Nov 07 2024 22:00:00 UTC
  })

  it('calculates end date in months', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Month,
      stakeDurationValue: 2,
      isDeveloperMode: false
    })
    expect(result).toBe(1735077600) // Tue, 24 Dec 2024 22:00:00 GMT
  })

  it('calculates end date in years', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Year,
      stakeDurationValue: 2,
      isDeveloperMode: false
    })
    expect(result).toBe(1792879200) //Sat Oct 24 2026 22:00:00 GMT+0000
  })

  it('calculates end date for custom duration with developer mode', () => {
    const mockCustomEndDate = getUnixTime(addDays(currentDate, 10)) // Custom example for mock return
    ;(getMinimumStakeEndTime as jest.Mock).mockReturnValueOnce(
      fromUnixTime(mockCustomEndDate)
    )

    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Custom,
      stakeDurationValue: 0, // Value may not be used in Custom format
      isDeveloperMode: true
    })

    expect(result).toBe(mockCustomEndDate)
    expect(getMinimumStakeEndTime).toHaveBeenCalledWith(true, currentDate)
  })
})
