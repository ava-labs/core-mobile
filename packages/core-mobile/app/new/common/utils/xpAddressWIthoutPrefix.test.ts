// write test for me
import { xpAddressWithoutPrefix } from './xpAddressWIthoutPrefix'

describe('xpAddressWithoutPrefix', () => {
  it('should remove the prefix from the address', () => {
    const address = 'P-1234567890'
    const result = xpAddressWithoutPrefix(address)
    expect(result).toBe('1234567890')
  })

  it('should return the address unchanged if no prefix', () => {
    const address = '1234567890'
    const result = xpAddressWithoutPrefix(address)
    expect(result).toBe('1234567890')
  })

  it('should handle empty strings', () => {
    const address = ''
    const result = xpAddressWithoutPrefix(address)
    expect(result).toBe('')
  })
})
