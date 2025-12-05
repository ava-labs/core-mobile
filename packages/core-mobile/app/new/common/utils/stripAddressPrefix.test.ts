import { stripAddressPrefix } from './stripAddressPrefix'

describe('stripAddressPrefix', () => {
  it('should remove the prefix from the address', () => {
    const address = 'P-1234567890'
    const result = stripAddressPrefix(address)
    expect(result).toBe('1234567890')
  })

  it('should return the address unchanged if no prefix', () => {
    const address = '1234567890'
    const result = stripAddressPrefix(address)
    expect(result).toBe('1234567890')
  })

  it('should handle empty strings', () => {
    const address = ''
    const result = stripAddressPrefix(address)
    expect(result).toBe('')
  })
})
