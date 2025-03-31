// tokenUtils.test.ts

import { TokenUnit } from '@avalabs/core-utils-sdk'
import { getMaxDecimals, normalizeValue } from './tokenUnitInput'

const xpChainToken = {
  maxDecimals: 9,
  symbol: 'AVAX'
}

describe('getMaxDecimals', () => {
  it('returns correct max decimals when whole part length is less than MAX_DIGITS', () => {
    // For a value "12345.67", the whole part "12345" has length 5.
    // MAX_DIGITS = 7, so expected decimals = 7 - 5 = 2.
    const token = new TokenUnit(
      12345670000000,
      xpChainToken.maxDecimals,
      xpChainToken.symbol
    )

    expect(getMaxDecimals(token)).toBe(2)
  })

  it('returns 0 when the whole part length is equal to or exceeds MAX_DIGITS', () => {
    // For "1234567.89", whole part "1234567" length is 7, so expected decimals = 7 - 7 = 0.
    const token1 = new TokenUnit(
      1234567890000000,
      xpChainToken.maxDecimals,
      xpChainToken.symbol
    )
    expect(getMaxDecimals(token1)).toBe(0)
  })

  it('handles values without decimals', () => {
    // For "123", whole part "123" length is 3 => expected decimals = 7 - 3 = 4.
    const token = new TokenUnit(
      123000000000,
      xpChainToken.maxDecimals,
      xpChainToken.symbol
    )
    expect(getMaxDecimals(token)).toBe(4)
  })
})

describe('normalizeValue', () => {
  it('returns "0" when the string consists solely of zeros', () => {
    expect(normalizeValue('000000')).toBe('0')
  })

  it('returns "0." when the string consists solely of zeros with a trailing dot', () => {
    expect(normalizeValue('000000.')).toBe('0.')
  })

  it('removes leading zeros for numbers with non-zero digits', () => {
    expect(normalizeValue('01111')).toBe('1111')
    expect(normalizeValue('000123')).toBe('123')
  })

  it('preserves the decimal point and following digits', () => {
    expect(normalizeValue('0123.45')).toBe('123.45')
  })

  it('prepends "0" when the string starts with a dot', () => {
    expect(normalizeValue('.123')).toBe('0.123')
  })
})
