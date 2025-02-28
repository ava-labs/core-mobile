import { formatNumber } from './formatNumber'

it('should handle zero', () => {
  expect(formatNumber(0)).toBe('0.00')
  expect(formatNumber('0')).toBe('0.00')
})

it('should handle very small numbers (< 0.01)', () => {
  expect(formatNumber(0.00000624)).toBe('0.000006')
  expect(formatNumber(0.000000123)).toBe('0.0000001')
  expect(formatNumber(0.000000000999)).toBe('0.0000000010')
  expect(formatNumber(-0.00000624)).toBe('0.000006')
})

it('should format numbers less than 1 million with fixed decimal places', () => {
  expect(formatNumber(123.456)).toBe('123.46')
  expect(formatNumber(999999.999)).toBe('1,000,000.00')
  expect(formatNumber(-999999.999)).toBe('1,000,000.00')
})

it('should format numbers greater than or equal to 1 million using shorthand notation', () => {
  expect(formatNumber(1234567)).toBe('1.23M')
  expect(formatNumber(-1234567)).toBe('1.23M')
  expect(formatNumber(1500000)).toBe('1.5M')
  expect(formatNumber(1000000000)).toBe('1B')
  expect(formatNumber(1000000000000)).toBe('1T')
})

it('should handle string inputs', () => {
  expect(formatNumber('1234567')).toBe('1.23M')
  expect(formatNumber('0.00000624')).toBe('0.000006')
  expect(formatNumber('999999.999')).toBe('1,000,000.00')
})
