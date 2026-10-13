import { getRoundedDurationInDays } from './index'

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS

describe('getRoundedDurationInDays', () => {
  const start = new Date('2026-07-15T14:30:00Z').getTime()

  it('rounds a custom stake up when now has just passed its time-of-day', () => {
    // 34d 23h 58m — truncation would read 34, one short of the selection.
    const end = start + 35 * DAY_MS - 2 * 60 * 1000
    expect(getRoundedDurationInDays(start, end)).toBe(35)
  })

  it('rounds the preset +1h slack back down to the labeled days', () => {
    expect(
      getRoundedDurationInDays(start, start + 180 * DAY_MS + HOUR_MS)
    ).toBe(180)
  })

  it('rounds the 365-day preset (-1h backoff) back up to 365', () => {
    expect(
      getRoundedDurationInDays(start, start + 365 * DAY_MS - HOUR_MS)
    ).toBe(365)
  })

  it('accepts Date instances as well as epoch millis', () => {
    expect(
      getRoundedDurationInDays(new Date(start), new Date(start + 14 * DAY_MS))
    ).toBe(14)
  })
})
