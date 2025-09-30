import { roundTokenDecimals } from './roundTokenDecimals'

describe('roundTokenDecimals', () => {
  it('returns the same value if displayDecimals >= tokenDecimals', () => {
    expect(roundTokenDecimals(123456789n, 6, 6)).toBe(123456789n)
    expect(roundTokenDecimals(123456789n, 6, 10)).toBe(123456789n)
    expect(roundTokenDecimals(123456789n, 0, 2)).toBe(123456789n) // integer tokens
  })

  it('floors fractional part while preserving the integer part (USDC 6dp)', () => {
    // 123.456789 USDC → 123456789n micro-units
    expect(roundTokenDecimals(123456789n, 6, 2)).toBe(123450000n) // 123.45
    expect(roundTokenDecimals(123456789n, 6, 4)).toBe(123456700n) // 123.4567
  })

  it('does not change a value already at desired precision', () => {
    // already at 2dp: 123.45 USDC → 123450000n
    expect(roundTokenDecimals(123450000n, 6, 2)).toBe(123450000n)
  })

  it('keeps tiny non-zero values instead of collapsing to 0 (BTC 8dp)', () => {
    // 0.00001234 BTC → 1234 sats
    // displayDecimals=2 would normally floor to 0; we keep original 1234n
    expect(roundTokenDecimals(1234n, 8, 2)).toBe(1234n)
  })

  it('keeps tiny non-zero values for tokens with 6 decimals too', () => {
    // 0.001234 (USDC 6dp) → 1234 micro-units
    expect(roundTokenDecimals(1234n, 6, 2)).toBe(1234n)
  })

  it('returns zero unchanged', () => {
    expect(roundTokenDecimals(0n, 6, 2)).toBe(0n)
  })

  it('handles large values without touching the integer portion', () => {
    // 1,000,000.123456 (USDC 6dp) → 1_000_000_123_456n
    expect(roundTokenDecimals(1_000_000_123_456n, 6, 2)).toBe(
      1_000_000_120_000n
    ) // 1,000,000.12
  })

  it('defaults displayDecimals to 3 when not provided', () => {
    // 1.234567 (USDC 6dp) → 1_234_567n micro-units
    expect(roundTokenDecimals(1_234_567n, 6)).toBe(1_234_000n) // 1.234
  })
})
