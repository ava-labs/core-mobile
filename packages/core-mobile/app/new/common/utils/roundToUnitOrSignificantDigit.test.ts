// roundToUnitOrSignificantDigit.test.ts
import { roundToUnitOrSignificantDigit } from './roundToUnitOrSignificantDigit'

describe('roundToUnitOrSignificantDigit', () => {
  it('rounds down to nearest multiple of unit when value ≥ unit', () => {
    // exponent = 2 → unit = 100
    expect(roundToUnitOrSignificantDigit(12345n, 2)).toBe(12300n)
    expect(roundToUnitOrSignificantDigit(100n, 2)).toBe(100n)
    expect(roundToUnitOrSignificantDigit(250n, 2)).toBe(200n)
  })

  it('reduces to most significant digit when 0 < value < unit', () => {
    // exponent = 3 → unit = 1000
    expect(roundToUnitOrSignificantDigit(999n, 3)).toBe(900n)
    expect(roundToUnitOrSignificantDigit(123n, 5)).toBe(100n) // 123 < 100000
    expect(roundToUnitOrSignificantDigit(5n, 1)).toBe(5n) // 5 < 10
    expect(roundToUnitOrSignificantDigit(42n, 2)).toBe(40n) // 42 < 100
  })

  it('returns zero unchanged', () => {
    expect(roundToUnitOrSignificantDigit(0n, 5)).toBe(0n)
    expect(roundToUnitOrSignificantDigit(0n, 0)).toBe(0n)
  })

  it('returns negative values unchanged', () => {
    expect(roundToUnitOrSignificantDigit(-12345n, 2)).toBe(-12345n)
    expect(roundToUnitOrSignificantDigit(-999n, 3)).toBe(-999n)
  })

  it('handles exponent = 0 correctly (unit = 1)', () => {
    // unit = 10^0 = 1 → every integer ≥1 is rounded to itself, 0 stays 0
    expect(roundToUnitOrSignificantDigit(7n, 0)).toBe(7n)
    expect(roundToUnitOrSignificantDigit(100n, 0)).toBe(100n)
    expect(roundToUnitOrSignificantDigit(0n, 0)).toBe(0n)
  })
})
