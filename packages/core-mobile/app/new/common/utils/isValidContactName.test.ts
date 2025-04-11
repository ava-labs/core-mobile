// write test for me
import { isValidContactName } from './isValidContactName'

describe('isValidContactName', () => {
  it('should return true for valid contact names', () => {
    expect(isValidContactName('John Doe')).toBe(true)
    expect(isValidContactName('Jane123')).toBe(true)
    expect(isValidContactName('!@#$%^&*()')).toBe(true)
    expect(isValidContactName('John_Doe')).toBe(true)
    expect(isValidContactName('   Jane-Doe')).toBe(true)
  })

  it('should return false for invalid contact names', () => {
    expect(isValidContactName('')).toBe(false)
    expect(isValidContactName(undefined)).toBe(false)
    expect(isValidContactName('     ')).toBe(false)
    expect(isValidContactName(null)).toBe(false)
  })
})
