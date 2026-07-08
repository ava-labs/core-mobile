import { formatUptime } from './formatUptime'

describe('formatUptime', () => {
  it('renders an exact 100 without decimals', () => {
    expect(formatUptime(100)).toBe('100')
    expect(formatUptime('100')).toBe('100')
  })

  it('truncates (not rounds) values below 100', () => {
    expect(formatUptime('99.999')).toBe('99.99')
    expect(formatUptime(99.995)).toBe('99.99')
  })

  it('keeps two decimals for ordinary values', () => {
    expect(formatUptime('99.9')).toBe('99.90')
    expect(formatUptime(98)).toBe('98.00')
  })
})
