import { isPositiveNumber } from './isPositiveNumber'

describe('isPositiveNumber', () => {
  test('returns true for positive numbers', () => {
    expect(isPositiveNumber(1)).toBe(true)
    expect(isPositiveNumber(100)).toBe(true)
    expect(isPositiveNumber(0.1)).toBe(true)
  })

  test('returns false for zero and negative numbers', () => {
    expect(isPositiveNumber(0)).toBe(false)
    expect(isPositiveNumber(-1)).toBe(false)
    expect(isPositiveNumber(-100)).toBe(false)
  })

  test('returns false for NaN', () => {
    expect(isPositiveNumber(NaN)).toBe(false)
  })

  test('returns false for non-number values', () => {
    expect(isPositiveNumber('5')).toBe(false)
    expect(isPositiveNumber(null)).toBe(false)
    expect(isPositiveNumber(undefined)).toBe(false)
    expect(isPositiveNumber({})).toBe(false)
    expect(isPositiveNumber([])).toBe(false)
    expect(isPositiveNumber(Symbol('test'))).toBe(false)
  })
})
