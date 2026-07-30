import { fromUnixTime, addDays, getUnixTime } from 'date-fns'
import {
  DURATION_OPTIONS_MAINNET,
  DURATION_OPTIONS_FUJI,
  DURATION_OPTIONS_WITH_DAYS_MAINNET,
  DurationOptionWithDays,
  getStakeEndDate,
  StakeDurationFormat,
  StakeDurationTitle,
  withNodeMaxOption
} from 'services/earn/getStakeEndDate'
import { getMinimumStakeEndTime } from 'services/earn/utils'

// Mocking the getMinimumStakeEndTime function
jest.mock('services/earn/utils', () => ({
  getMinimumStakeEndTime: jest.fn()
}))

describe('getStakeEndDate', () => {
  const startDateUnix = 1729807200 // Thu Oct 24 2024 22:00:00 UTC
  const currentDate = fromUnixTime(startDateUnix) // Date representation in UTC

  it('calculates end date in days with +1h of submit-drift slack', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Day,
      stakeDurationValue: 1,
      isDeveloperMode: false
    })
    // 1 day + 1 hour: the slack keeps the realized duration from rounding
    // below the selected days once the start is re-anchored at submit time.
    expect(result).toBe(startDateUnix + 25 * 60 * 60)
  })

  it('gives a 180-day selection exactly 180 days (+1h), not 6 calendar months', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Day,
      stakeDurationValue: 180,
      isDeveloperMode: false
    })
    expect(result).toBe(startDateUnix + (180 * 24 + 1) * 60 * 60)
  })

  it('backs the 365-day selection off by 1h to stay under the protocol max', () => {
    const result = getStakeEndDate({
      startDateUnix,
      stakeDurationFormat: StakeDurationFormat.Day,
      stakeDurationValue: 365,
      isDeveloperMode: false
    })
    expect(result).toBe(startDateUnix + (365 * 24 - 1) * 60 * 60)
  })

  it('defines every preset in whole days matching its label (web parity)', () => {
    const presets = [...DURATION_OPTIONS_MAINNET, ...DURATION_OPTIONS_FUJI]
    presets
      // Type guard (not a plain predicate) so `numberOfDays` narrows below.
      .filter(
        (option): option is DurationOptionWithDays =>
          option.title !== StakeDurationTitle.CUSTOM
      )
      .forEach(option => {
        expect(option.stakeDurationFormat).toBe(StakeDurationFormat.Day)
        expect(option.stakeDurationValue).toBe(option.numberOfDays)
      })
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

describe('withNodeMaxOption', () => {
  const base: DurationOptionWithDays[] = DURATION_OPTIONS_WITH_DAYS_MAINNET

  it('swaps the 1 Year preset for a Node max option with the given days', () => {
    const result = withNodeMaxOption(base, 134)
    const nodeMax = result.find(o => o.title === StakeDurationTitle.NODE_MAX)
    expect(nodeMax).toEqual({
      title: StakeDurationTitle.NODE_MAX,
      numberOfDays: 134,
      stakeDurationFormat: StakeDurationFormat.Day,
      stakeDurationValue: 134
    })
    expect(result.some(o => o.title === StakeDurationTitle.ONE_YEAR)).toBe(
      false
    )
  })

  it('keeps every other preset and the list positions intact', () => {
    // Index-based helpers (default/custom index) rely on positions not
    // shifting when the delegate flow swaps the option in.
    const result = withNodeMaxOption(base, 200)
    expect(result).toHaveLength(base.length)
    base.forEach((option, index) => {
      if (option.title !== StakeDurationTitle.ONE_YEAR) {
        expect(result[index]).toBe(option)
      } else {
        expect(result[index]?.title).toBe(StakeDurationTitle.NODE_MAX)
      }
    })
  })

  it('does not mutate the source list', () => {
    withNodeMaxOption(base, 10)
    expect(base.some(o => o.title === StakeDurationTitle.ONE_YEAR)).toBe(true)
  })
})
