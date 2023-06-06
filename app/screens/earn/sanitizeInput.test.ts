import { stringToBN } from '@avalabs/utils-sdk'
import sanitizeInput from 'screens/earn/sanitizeInput'

describe('earn/sanitizeInput', () => {
  describe('sanitizeInput', () => {
    it('should not limit whole number portion', () => {
      expect(sanitizeInput(stringToBN('123', 0), 0)).toEqual(
        stringToBN('123', 0)
      )
      expect(sanitizeInput(stringToBN('1234567890', 0), 0)).toEqual(
        stringToBN('1234567890', 0)
      )
      expect(sanitizeInput(stringToBN('1234567890.123', 0), 0)).toEqual(
        stringToBN('1234567890.123', 0)
      )
    })

    it('should trim decimals to total of 7 digits (combined with whole part)', () => {
      expect(sanitizeInput(stringToBN('123.456', 0), 0)).toEqual(
        stringToBN('123.456', 0)
      )
      expect(sanitizeInput(stringToBN('123.4567', 0), 0)).toEqual(
        stringToBN('123.4567', 0)
      )
      expect(sanitizeInput(stringToBN('123.45678', 0), 0)).toEqual(
        stringToBN('123.4567', 0)
      )
      expect(sanitizeInput(stringToBN('123.4567890', 0), 0)).toEqual(
        stringToBN('123.4567', 0)
      )
      expect(sanitizeInput(stringToBN('1234567.4567890', 0), 0)).toEqual(
        stringToBN('1234567', 0)
      )
      expect(sanitizeInput(stringToBN('12345678.4567890', 0), 0)).toEqual(
        stringToBN('12345678', 0)
      )
    })

    it('should return undefined if input is undefined', () => {
      expect(sanitizeInput(undefined, 0)).toEqual(undefined)
    })
  })
})
