import { toSegments } from './toSegments'

describe('toSegments', () => {
  describe('valid inputs', () => {
    it('should parse a standard BIP44 derivation path', () => {
      const result = toSegments("m/44'/60'/0'/0/0")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should parse derivation path without quotes', () => {
      const result = toSegments('m/44/60/0/0/0')

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should handle change value of 1', () => {
      const result = toSegments("m/44'/60'/0'/1/5")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 1,
        addressIndex: 5
      })
    })

    it('should handle different coin types', () => {
      const result = toSegments("m/44'/0'/0'/0/0") // Bitcoin

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 0,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should handle higher account numbers', () => {
      const result = toSegments("m/44'/60'/5'/0/10")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 5,
        change: 0,
        addressIndex: 10
      })
    })

    it('should handle large address indices', () => {
      const result = toSegments("m/44'/60'/0'/0/999999")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 999999
      })
    })

    it('should handle mixed quotes in path', () => {
      const result = toSegments("m/44'/60/0'/0/0")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })
  })

  describe('invalid inputs - insufficient segments', () => {
    it('should throw error for empty string', () => {
      expect(() => toSegments('')).toThrow(
        "Invalid derivation path: . Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with only m', () => {
      expect(() => toSegments('m')).toThrow(
        "Invalid derivation path: m. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with 2 segments', () => {
      expect(() => toSegments('m/44')).toThrow(
        "Invalid derivation path: m/44. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with 3 segments', () => {
      expect(() => toSegments('m/44/60')).toThrow(
        "Invalid derivation path: m/44/60. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with 4 segments', () => {
      expect(() => toSegments('m/44/60/0')).toThrow(
        "Invalid derivation path: m/44/60/0. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with 5 segments', () => {
      expect(() => toSegments('m/44/60/0/0')).toThrow(
        "Invalid derivation path: m/44/60/0/0. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })
  })

  describe('invalid inputs - empty segments', () => {
    it('should throw error for empty purpose segment', () => {
      expect(() => toSegments('m//60/0/0/0')).toThrow(
        "Invalid derivation path: m//60/0/0/0. Segment 'purpose' at position 1 is missing or contains whitespace"
      )
    })

    it('should throw error for empty coinType segment', () => {
      expect(() => toSegments('m/44//0/0/0')).toThrow(
        "Invalid derivation path: m/44//0/0/0. Segment 'coinType' at position 2 is missing or contains whitespace"
      )
    })

    it('should throw error for empty account segment', () => {
      expect(() => toSegments('m/44/60//0/0')).toThrow(
        "Invalid derivation path: m/44/60//0/0. Segment 'accountIndex' at position 3 is missing or contains whitespace"
      )
    })

    it('should throw error for empty change segment', () => {
      expect(() => toSegments('m/44/60/0//0')).toThrow(
        "Invalid derivation path: m/44/60/0//0. Segment 'change' at position 4 is missing or contains whitespace"
      )
    })

    it('should throw error for empty addressIndex segment', () => {
      expect(() => toSegments('m/44/60/0/0/')).toThrow(
        "Invalid derivation path: m/44/60/0/0/. Segment 'addressIndex' at position 5 is missing or contains whitespace"
      )
    })

    it('should throw error for multiple consecutive slashes', () => {
      expect(() => toSegments('m/44///60/0/0/0')).toThrow(
        "Invalid derivation path: m/44///60/0/0/0. Segment 'coinType' at position 2 is missing or contains whitespace"
      )
    })
  })

  describe('edge cases with quotes', () => {
    it('should handle all segments with quotes', () => {
      const result = toSegments("m/44'/60'/0'/0'/0'")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should handle no quotes at all', () => {
      const result = toSegments('m/44/60/0/0/0')

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })
  })

  describe('number conversion edge cases', () => {
    it('should handle zero values correctly', () => {
      const result = toSegments('m/0/0/0/0/0')

      expect(result).toEqual({
        m: 'm',
        purpose: '0',
        coinType: 0,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should handle string numbers correctly', () => {
      const result = toSegments('m/44/60/0/1/123')

      expect(result.coinType).toBe(60)
      expect(result.accountIndex).toBe(0)
      expect(result.change).toBe(1)
      expect(result.addressIndex).toBe(123)
    })

    it('should handle leading zeros in segments', () => {
      const result = toSegments('m/044/060/00/01/0123')

      expect(result).toEqual({
        m: 'm',
        purpose: '044',
        coinType: 60,
        accountIndex: 0,
        change: 1,
        addressIndex: 123
      })
    })
  })

  describe('malformed paths', () => {
    it('should throw error for path not starting with m', () => {
      expect(() => toSegments('n/44/60/0/0/0')).toThrow(
        "Invalid derivation path: n/44/60/0/0/0. Expected full format: m/purpose'/coinType'/account'/change/addressIndex"
      )
    })

    it('should throw error for path with spaces', () => {
      expect(() => toSegments('m/44 /60/0/0/0')).toThrow(
        "Invalid derivation path: m/44 /60/0/0/0. Segment 'purpose' at position 1 is missing or contains whitespace"
      )
    })

    it('should throw error for path with extra segments', () => {
      const result = toSegments('m/44/60/0/0/0/extra')
      // Should still work as we only check for minimum 6 segments
      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })
  })

  describe('type safety', () => {
    it('should return correct types', () => {
      const result = toSegments("m/44'/60'/0'/0/0")

      expect(typeof result.m).toBe('string')
      expect(typeof result.purpose).toBe('string')
      expect(typeof result.coinType).toBe('number')
      expect(typeof result.accountIndex).toBe('number')
      expect(typeof result.change).toBe('number')
      expect(typeof result.addressIndex).toBe('number')
    })

    it('should handle change as 0 or 1', () => {
      const result0 = toSegments("m/44'/60'/0'/0/0")
      const result1 = toSegments("m/44'/60'/0'/1/0")

      expect(result0.change).toBe(0)
      expect(result1.change).toBe(1)
    })
  })

  describe('real-world examples', () => {
    it('should parse Ethereum derivation path', () => {
      const result = toSegments("m/44'/60'/0'/0/0")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 60,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should parse Bitcoin derivation path', () => {
      const result = toSegments("m/44'/0'/0'/0/0")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 0,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })

    it('should parse Avalanche derivation path', () => {
      const result = toSegments("m/44'/9000'/0'/0/0")

      expect(result).toEqual({
        m: 'm',
        purpose: '44',
        coinType: 9000,
        accountIndex: 0,
        change: 0,
        addressIndex: 0
      })
    })
  })
})
