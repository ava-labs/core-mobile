import { formatFeePercent } from './formatFeePercent'

describe('formatFeePercent', () => {
  it('renders a clean integer for the default 10% rate', () => {
    expect(formatFeePercent(0.1)).toBe('10')
  })

  it('strips floating-point artifacts (0.07 × 100 = 7.000000000000001)', () => {
    expect(formatFeePercent(0.07)).toBe('7')
  })

  it('keeps a single decimal place for non-integer percentages', () => {
    expect(formatFeePercent(0.025)).toBe('2.5')
  })

  it('rounds to two decimals for finer-grained rates', () => {
    expect(formatFeePercent(0.12345)).toBe('12.35')
  })

  it('returns "0" for a zero rate', () => {
    expect(formatFeePercent(0)).toBe('0')
  })
})
