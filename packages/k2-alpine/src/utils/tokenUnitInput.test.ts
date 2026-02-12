// tokenUtils.test.ts

import { TokenUnit } from '@avalabs/core-utils-sdk'
import {
  getMaxDecimals,
  normalizeValue,
  normalizeNumericTextInput,
  parseDecimalToBigInt
} from './tokenUnitInput'

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

describe('normalizeNumericTextInput', () => {
  describe('comma handling - aggressive testing', () => {
    it('converts single commas to periods', () => {
      expect(normalizeNumericTextInput('1,5')).toBe('1.5')
      expect(normalizeNumericTextInput('0,001')).toBe('0.001')
      expect(normalizeNumericTextInput('123,456')).toBe('123.456')
    })

    it('converts multiple commas in various positions', () => {
      expect(normalizeNumericTextInput('1,234,567')).toBe('1.234567')
      expect(normalizeNumericTextInput('1,234,567,890')).toBe('1.234567890')
      expect(normalizeNumericTextInput('1,234,567,890,123')).toBe(
        '1.234567890123'
      )
    })

    it('handles commas mixed with periods', () => {
      expect(normalizeNumericTextInput('1,234.56')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56,78')).toBe('1.2345678')
      expect(normalizeNumericTextInput('1.234,56')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56,78,90')).toBe('1.234567890')
    })

    it('handles consecutive commas', () => {
      expect(normalizeNumericTextInput('1,,234')).toBe('1.234')
      expect(normalizeNumericTextInput('1,,,234')).toBe('1.234')
      expect(normalizeNumericTextInput('1,,,,234')).toBe('1.234')
    })

    it('handles commas at the beginning', () => {
      expect(normalizeNumericTextInput(',123')).toBe('.123')
      expect(normalizeNumericTextInput(',,123')).toBe('.123')
      expect(normalizeNumericTextInput(',123,456')).toBe('.123456')
    })

    it('handles commas at the end', () => {
      expect(normalizeNumericTextInput('123,')).toBe('123.')
      expect(normalizeNumericTextInput('123,,')).toBe('123.')
      expect(normalizeNumericTextInput('123,456,')).toBe('123.456')
    })

    it('handles only commas', () => {
      expect(normalizeNumericTextInput(',')).toBe('.')
      expect(normalizeNumericTextInput(',,')).toBe('.')
      expect(normalizeNumericTextInput(',,,')).toBe('.')
    })

    it('handles complex comma scenarios', () => {
      expect(normalizeNumericTextInput('1,234,567,890,123,456,789')).toBe(
        '1.234567890123456789'
      )
      expect(normalizeNumericTextInput('0,0,0,1')).toBe('0.001')
      expect(normalizeNumericTextInput('1,2,3,4,5,6,7,8,9')).toBe('1.23456789')
    })

    it('handles European-style number formatting', () => {
      expect(normalizeNumericTextInput('1.234,56')).toBe('1.23456')
      expect(normalizeNumericTextInput('1.234.567,89')).toBe('1.23456789')
      expect(normalizeNumericTextInput('1.234.567.890,12')).toBe(
        '1.23456789012'
      )
    })

    it('handles mixed European and American formatting', () => {
      expect(normalizeNumericTextInput('1,234.567,89')).toBe('1.23456789')
      expect(normalizeNumericTextInput('1.234,567.89')).toBe('1.23456789')
      expect(normalizeNumericTextInput('1,234.567.890,12')).toBe(
        '1.23456789012'
      )
    })
  })

  describe('non-numeric character removal', () => {
    it('removes currency symbols with commas', () => {
      expect(normalizeNumericTextInput('$1,234.56')).toBe('1.23456')
      expect(normalizeNumericTextInput('€1,234,567.89')).toBe('1.23456789')
      expect(normalizeNumericTextInput('£1,234,567,890')).toBe('1.234567890')
      expect(normalizeNumericTextInput('¥1,234,567,890,123')).toBe(
        '1.234567890123'
      )
    })

    it('removes percentage and other symbols with commas', () => {
      expect(normalizeNumericTextInput('1,234.56%')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234,567.89%')).toBe('1.23456789')
      expect(normalizeNumericTextInput('1,234.56‰')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56‱')).toBe('1.23456')
    })

    it('removes letters mixed with commas', () => {
      expect(normalizeNumericTextInput('1abc,234')).toBe('1.234')
      expect(normalizeNumericTextInput('1,234abc.56')).toBe('1.23456')
      expect(normalizeNumericTextInput('abc1,234def')).toBe('1.234')
      expect(normalizeNumericTextInput('1,234abc,567')).toBe('1.234567')
    })

    it('removes special characters with commas', () => {
      expect(normalizeNumericTextInput('1,234.56+')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56-')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56*')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56/')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56=')).toBe('1.23456')
    })
  })

  describe('leading zero handling with commas', () => {
    it('handles leading zeros with commas', () => {
      expect(normalizeNumericTextInput('001,234')).toBe('1.234')
      expect(normalizeNumericTextInput('000,001')).toBe('0.001')
      expect(normalizeNumericTextInput('00,123,456')).toBe('0.123456')
      expect(normalizeNumericTextInput('000,000,001')).toBe('0.000001')
    })

    it('handles multiple leading zeros with commas', () => {
      expect(normalizeNumericTextInput('000001,234')).toBe('1.234')
      expect(normalizeNumericTextInput('000000,001')).toBe('0.001')
      expect(normalizeNumericTextInput('000000,000,001')).toBe('0.000001')
    })
  })

  describe('multiple decimal points with commas', () => {
    it('removes multiple decimal points, keeping only the first', () => {
      expect(normalizeNumericTextInput('1.234.56')).toBe('1.23456')
      expect(normalizeNumericTextInput('1,234.56.78')).toBe('1.2345678')
      expect(normalizeNumericTextInput('1..234')).toBe('1.234')
      expect(normalizeNumericTextInput('1,234.56.78.90')).toBe('1.234567890')
    })

    it('handles multiple periods and commas mixed', () => {
      expect(normalizeNumericTextInput('1.234,56.78')).toBe('1.2345678')
      expect(normalizeNumericTextInput('1,234.56.78.90')).toBe('1.234567890')
      expect(normalizeNumericTextInput('1.234.567,89.01')).toBe('1.2345678901')
    })
  })

  describe('edge cases with commas', () => {
    it('handles empty and single character inputs', () => {
      expect(normalizeNumericTextInput('')).toBe('')
      expect(normalizeNumericTextInput('0')).toBe('0')
      expect(normalizeNumericTextInput(',')).toBe('.')
      expect(normalizeNumericTextInput('.')).toBe('.')
    })

    it('handles inputs starting with comma or period', () => {
      expect(normalizeNumericTextInput(',123')).toBe('.123')
      expect(normalizeNumericTextInput('.123')).toBe('.123')
      expect(normalizeNumericTextInput(',123,456')).toBe('.123456')
      expect(normalizeNumericTextInput('.123,456')).toBe('.123456')
    })

    it('handles inputs ending with comma or period', () => {
      expect(normalizeNumericTextInput('123,')).toBe('123.')
      expect(normalizeNumericTextInput('123.')).toBe('123.')
      expect(normalizeNumericTextInput('123,456,')).toBe('123.456')
      expect(normalizeNumericTextInput('123,456.')).toBe('123.456')
    })
  })

  describe('valid numeric inputs preservation', () => {
    it('preserves valid decimal inputs', () => {
      expect(normalizeNumericTextInput('123.45')).toBe('123.45')
      expect(normalizeNumericTextInput('0.001')).toBe('0.001')
      expect(normalizeNumericTextInput('1000')).toBe('1000')
      expect(normalizeNumericTextInput('123')).toBe('123')
    })

    it('preserves inputs without commas', () => {
      expect(normalizeNumericTextInput('123456789')).toBe('123456789')
      expect(normalizeNumericTextInput('0.123456789')).toBe('0.123456789')
      expect(normalizeNumericTextInput('123456789.123456789')).toBe(
        '123456789.123456789'
      )
    })
  })
})

describe('parseDecimalToBigInt', () => {
  describe('basic conversions', () => {
    it('converts whole numbers correctly', () => {
      expect(parseDecimalToBigInt('1', 18)).toBe(1000000000000000000n)
      expect(parseDecimalToBigInt('100', 18)).toBe(100000000000000000000n)
      expect(parseDecimalToBigInt('1', 8)).toBe(100000000n)
    })

    it('converts decimal numbers correctly', () => {
      expect(parseDecimalToBigInt('1.5', 18)).toBe(1500000000000000000n)
      expect(parseDecimalToBigInt('0.5', 18)).toBe(500000000000000000n)
      expect(parseDecimalToBigInt('1.23', 8)).toBe(123000000n)
    })

    it('handles high precision decimals', () => {
      expect(parseDecimalToBigInt('0.15358017127655023', 18)).toBe(
        153580171276550230n
      )
      expect(parseDecimalToBigInt('0.000000000000000001', 18)).toBe(1n)
    })
  })

  describe('edge cases', () => {
    it('returns 0n for empty or zero values', () => {
      expect(parseDecimalToBigInt('', 18)).toBe(0n)
      expect(parseDecimalToBigInt('0', 18)).toBe(0n)
      expect(parseDecimalToBigInt('0.', 18)).toBe(0n)
    })

    it('handles values with commas (formatted numbers)', () => {
      expect(parseDecimalToBigInt('1,000', 18)).toBe(1000000000000000000000n)
      expect(parseDecimalToBigInt('1,234.56', 8)).toBe(123456000000n)
    })

    it('truncates decimals exceeding specified precision', () => {
      // 18 decimals, but input has 20 decimal places
      expect(parseDecimalToBigInt('0.12345678901234567890', 18)).toBe(
        123456789012345678n
      )
    })

    it('pads decimals when input has fewer than specified', () => {
      expect(parseDecimalToBigInt('1.5', 18)).toBe(1500000000000000000n)
      expect(parseDecimalToBigInt('0.1', 8)).toBe(10000000n)
    })

    it('handles leading zeros in integer part', () => {
      expect(parseDecimalToBigInt('01', 18)).toBe(1000000000000000000n)
      expect(parseDecimalToBigInt('001.5', 18)).toBe(1500000000000000000n)
    })
  })

  describe('precision preservation', () => {
    it('preserves precision for large numbers', () => {
      expect(parseDecimalToBigInt('9999999999.999999999999999999', 18)).toBe(
        9999999999999999999999999999n
      )
    })

    it('handles small decimal values correctly', () => {
      expect(parseDecimalToBigInt('0.000001', 18)).toBe(1000000000000n)
      expect(parseDecimalToBigInt('0.00000001', 8)).toBe(1n)
    })
  })
})
