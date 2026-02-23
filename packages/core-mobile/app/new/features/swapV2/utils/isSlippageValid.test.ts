import { MIN_SLIPPAGE_PERCENT, MAX_SLIPPAGE_PERCENT } from '../consts'
import { isSlippageValid } from './isSlippageValid'

describe('isSlippageValid', () => {
  describe('Valid slippage values', () => {
    it('should return true for minimum allowed slippage', () => {
      expect(isSlippageValid(MIN_SLIPPAGE_PERCENT.toString())).toBe(true)
    })

    it('should return true for maximum allowed slippage', () => {
      expect(isSlippageValid(MAX_SLIPPAGE_PERCENT.toString())).toBe(true)
    })

    it('should return true for slippage within valid range', () => {
      expect(isSlippageValid('2')).toBe(true)
      expect(isSlippageValid('5')).toBe(true)
      expect(isSlippageValid('10')).toBe(true)
      expect(isSlippageValid('25')).toBe(true)
    })

    it('should return true for decimal values within range', () => {
      expect(isSlippageValid('0.5')).toBe(true)
      expect(isSlippageValid('1.5')).toBe(true)
      expect(isSlippageValid('2.5')).toBe(true)
      expect(isSlippageValid('49.9')).toBe(true)
    })

    it('should return true for values with leading zeros', () => {
      expect(isSlippageValid('01')).toBe(true)
      expect(isSlippageValid('02.5')).toBe(true)
    })

    it('should return true for values with trailing zeros', () => {
      expect(isSlippageValid('2.0')).toBe(true)
      expect(isSlippageValid('5.00')).toBe(true)
    })
  })

  describe('Invalid slippage values - Out of range', () => {
    it('should return false for values below minimum', () => {
      expect(isSlippageValid('0')).toBe(false)
      expect(isSlippageValid('0.05')).toBe(false)
      expect(isSlippageValid('0.09')).toBe(false)
    })

    it('should return false for values above maximum', () => {
      expect(isSlippageValid('50.1')).toBe(false)
      expect(isSlippageValid('51')).toBe(false)
      expect(isSlippageValid('100')).toBe(false)
    })

    it('should return false for negative values', () => {
      expect(isSlippageValid('-1')).toBe(false)
      expect(isSlippageValid('-0.5')).toBe(false)
    })
  })

  describe('Invalid slippage values - Format', () => {
    it('should return false for empty string', () => {
      expect(isSlippageValid('')).toBe(false)
    })

    it('should return false for non-numeric strings', () => {
      expect(isSlippageValid('abc')).toBe(false)
      expect(isSlippageValid('auto')).toBe(false)
      expect(isSlippageValid('NaN')).toBe(false)
    })

    it('should accept strings where parseFloat extracts valid numbers', () => {
      // parseFloat is lenient and extracts numbers from strings
      expect(isSlippageValid('2%')).toBe(true) // parseFloat('2%') = 2
      expect(isSlippageValid('5 percent')).toBe(true) // parseFloat('5 percent') = 5
      expect(isSlippageValid('2.5.3')).toBe(true) // parseFloat('2.5.3') = 2.5
    })

    it('should return false for special numeric values', () => {
      expect(isSlippageValid('Infinity')).toBe(false)
      expect(isSlippageValid('-Infinity')).toBe(false)
    })

    it('should return false for whitespace-only strings', () => {
      expect(isSlippageValid(' ')).toBe(false)
      expect(isSlippageValid('  ')).toBe(false)
      expect(isSlippageValid('\t')).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle values with leading/trailing whitespace (parseFloat trims)', () => {
      // parseFloat ignores leading/trailing whitespace
      expect(isSlippageValid(' 2 ')).toBe(true)
      expect(isSlippageValid(' 5.5 ')).toBe(true)
    })

    it('should handle scientific notation strings', () => {
      // parseFloat handles scientific notation
      expect(isSlippageValid('1e1')).toBe(true) // 10
      expect(isSlippageValid('2.5e0')).toBe(true) // 2.5
      expect(isSlippageValid('1e2')).toBe(false) // 100, above max
    })

    it('should validate exact boundary values', () => {
      // Just above minimum
      expect(isSlippageValid('0.10001')).toBe(true)

      // Just below minimum
      expect(isSlippageValid('0.09999')).toBe(false)

      // Just below maximum
      expect(isSlippageValid('49.99999')).toBe(true)

      // Just above maximum
      expect(isSlippageValid('50.00001')).toBe(false)
    })

    it('should handle very precise decimal values', () => {
      expect(isSlippageValid('0.123456789')).toBe(true)
      expect(isSlippageValid('49.999999999')).toBe(true)
    })
  })
})
