import { format } from 'date-fns'
import { formatRelativeDateTime } from './formatRelativeDateTime'

describe('formatRelativeDateTime', () => {
  it('returns time only for today', () => {
    const now = Date.now()
    expect(formatRelativeDateTime(now)).toBe(format(now, 'h:mm a'))
  })

  it("prefixes 'Yesterday' for the previous day", () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    expect(formatRelativeDateTime(yesterday)).toBe(
      `Yesterday\n${format(yesterday, 'h:mm a')}`
    )
  })

  it('uses MM/dd/yy for older dates', () => {
    const older = 1752969420000
    expect(formatRelativeDateTime(older)).toBe(
      `${format(older, 'MM/dd/yy')}\n${format(older, 'h:mm a')}`
    )
  })

  it('joins with a custom separator', () => {
    const yesterday = Date.now() - 24 * 60 * 60 * 1000
    expect(formatRelativeDateTime(yesterday, ' · ')).toBe(
      `Yesterday · ${format(yesterday, 'h:mm a')}`
    )
  })
})
