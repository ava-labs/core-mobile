import { isBareChainPrefix, stripAddressPrefix } from './stripAddressPrefix'

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

describe('isBareChainPrefix', () => {
  it.each(['P-', 'X-', 'C-'])('detects a bare %s prefix', prefix => {
    expect(isBareChainPrefix(prefix)).toBe(true)
  })

  it.each([
    ['a prefixed address', 'P-avax1qurswpc8qurswpc8qurswpc8qurswpc8x32neu'],
    ['an unprefixed address', 'avax1qurswpc8qurswpc8qurswpc8qurswpc8x32neu'],
    ['an EVM address', '0x449b3fFFE66378227DbBd05539B6542E5cA75A28'],
    ['an empty string', ''],
    ['a lone hyphen', '-'],
    ['an unknown alias', 'Z-']
  ])('returns false for %s', (_name, address) => {
    expect(isBareChainPrefix(address)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isBareChainPrefix(undefined)).toBe(false)
  })
})
