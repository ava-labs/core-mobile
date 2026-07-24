import { format } from 'date-fns'
import { formatRelativeDateTime } from './formatRelativeDateTime'

// Freeze time: Date.now()-based offsets are flaky around DST transitions and
// day boundaries. Timestamps use local-time date strings (no Z suffix) so the
// calendar-day relationships hold in any runner TZ.
describe('formatRelativeDateTime', () => {
  beforeAll(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-07-20T12:00:00'))
  })

  afterAll(() => {
    jest.useRealTimers()
  })

  it('returns time only for today', () => {
    const today = new Date('2025-07-20T09:15:00').getTime()
    expect(formatRelativeDateTime(today)).toBe(format(today, 'h:mm a'))
  })

  it("prefixes 'Yesterday' for the previous day", () => {
    const yesterday = new Date('2025-07-19T15:30:00').getTime()
    expect(formatRelativeDateTime(yesterday)).toBe(
      `Yesterday\n${format(yesterday, 'h:mm a')}`
    )
  })

  it('uses MM/dd/yy for older dates', () => {
    const older = new Date('2025-06-01T15:30:00').getTime()
    expect(formatRelativeDateTime(older)).toBe(
      `${format(older, 'MM/dd/yy')}\n${format(older, 'h:mm a')}`
    )
  })

  it('joins with a custom separator', () => {
    const yesterday = new Date('2025-07-19T15:30:00').getTime()
    expect(formatRelativeDateTime(yesterday, ' · ')).toBe(
      `Yesterday · ${format(yesterday, 'h:mm a')}`
    )
  })
})
