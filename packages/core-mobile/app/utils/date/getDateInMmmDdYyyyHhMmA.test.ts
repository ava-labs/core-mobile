import { getDateInMmmDdYyyyHhMmA } from './getDateInMmmDdYyyyHhMmA'

const toSeconds = (date: Date): number => date.getTime() / 1000

describe('getDateInMmmDdYyyyHhMmA', () => {
  it('returns afternoon times on a 12-hour clock', () => {
    expect(
      getDateInMmmDdYyyyHhMmA(toSeconds(new Date(2099, 11, 31, 16, 0)))
    ).toBe('Dec 31, 2099, 04:00 PM')
  })

  it('returns midnight as 12 AM', () => {
    expect(
      getDateInMmmDdYyyyHhMmA(toSeconds(new Date(2025, 0, 5, 0, 30)))
    ).toBe('Jan 05, 2025, 12:30 AM')
  })
})
