import { convertUsdToTokenAmount } from './convertUsdToTokenAmount'

describe('convertUsdToTokenAmount', () => {
  describe('basic conversions', () => {
    it('converts USD to token amount with matching decimals', () => {
      // $100 USD (8 decimals) with token price $1 (8 decimals), token has 18 decimals
      // Expected: 99 tokens (with 1% safety buffer)
      const result = convertUsdToTokenAmount({
        usdAmount: 10000000000n, // $100 with 8 decimals
        tokenPriceUSD: 100000000n, // $1 with 8 decimals
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      // 99 tokens with 18 decimals = 99 * 10^18
      expect(result).toBe(99000000000000000000n)
    })

    it('converts with different token price', () => {
      // $100 USD (8 decimals) with token price $2 (8 decimals), token has 18 decimals
      // Expected: ~49.5 tokens (with 1% safety buffer)
      const result = convertUsdToTokenAmount({
        usdAmount: 10000000000n, // $100 with 8 decimals
        tokenPriceUSD: 200000000n, // $2 with 8 decimals
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      // 49.5 tokens with 18 decimals
      expect(result).toBe(49500000000000000000n)
    })
  })

  describe('safety buffer', () => {
    it('applies default 1% safety buffer', () => {
      const result = convertUsdToTokenAmount({
        usdAmount: 100n,
        tokenPriceUSD: 1n,
        tokenDecimals: 0,
        usdDecimals: 0,
        priceDecimals: 0
      })

      // 100 * 99% = 99
      expect(result).toBe(99n)
    })

    it('applies custom safety buffer', () => {
      const result = convertUsdToTokenAmount({
        usdAmount: 100n,
        tokenPriceUSD: 1n,
        tokenDecimals: 0,
        usdDecimals: 0,
        priceDecimals: 0,
        safetyBufferPercent: 5
      })

      // 100 * 95% = 95
      expect(result).toBe(95n)
    })

    it('handles 0% safety buffer', () => {
      const result = convertUsdToTokenAmount({
        usdAmount: 100n,
        tokenPriceUSD: 1n,
        tokenDecimals: 0,
        usdDecimals: 0,
        priceDecimals: 0,
        safetyBufferPercent: 0
      })

      // 100 * 100% = 100
      expect(result).toBe(100n)
    })
  })

  describe('edge cases', () => {
    it('returns 0n when token price is 0', () => {
      const result = convertUsdToTokenAmount({
        usdAmount: 100n,
        tokenPriceUSD: 0n,
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      expect(result).toBe(0n)
    })

    it('returns 0n when USD amount is 0', () => {
      const result = convertUsdToTokenAmount({
        usdAmount: 0n,
        tokenPriceUSD: 100000000n,
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      expect(result).toBe(0n)
    })
  })

  describe('scale factor handling', () => {
    it('handles positive scale factor (more token decimals)', () => {
      // Token has 18 decimals, USD has 8, price has 8
      // Scale factor = 18 + 8 - 8 = 18 (positive)
      const result = convertUsdToTokenAmount({
        usdAmount: 100000000n, // $1 with 8 decimals
        tokenPriceUSD: 100000000n, // $1 with 8 decimals
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      // 0.99 tokens with 18 decimals
      expect(result).toBe(990000000000000000n)
    })

    it('handles negative scale factor (fewer token decimals)', () => {
      // Token has 6 decimals, USD has 18, price has 8
      // Scale factor = 6 + 8 - 18 = -4 (negative)
      const result = convertUsdToTokenAmount({
        usdAmount: 1000000000000000000n, // $1 with 18 decimals
        tokenPriceUSD: 100000000n, // $1 with 8 decimals
        tokenDecimals: 6,
        usdDecimals: 18,
        priceDecimals: 8
      })

      // 0.99 tokens with 6 decimals = 990000
      expect(result).toBe(990000n)
    })

    it('handles zero scale factor', () => {
      // Token has 8 decimals, USD has 8, price has 8
      // Scale factor = 8 + 8 - 8 = 8 (positive but balanced)
      const result = convertUsdToTokenAmount({
        usdAmount: 100000000n, // $1 with 8 decimals
        tokenPriceUSD: 100000000n, // $1 with 8 decimals
        tokenDecimals: 8,
        usdDecimals: 8,
        priceDecimals: 8
      })

      // 0.99 tokens with 8 decimals
      expect(result).toBe(99000000n)
    })
  })

  describe('AAVE-like scenarios', () => {
    it('converts AAVE borrow amount correctly', () => {
      // AAVE: USD with 8 decimals, price with 8 decimals, token (AVAX) with 18 decimals
      // Available borrow: $50 (5000000000n with 8 decimals)
      // AVAX price: $25 (2500000000n with 8 decimals)
      const result = convertUsdToTokenAmount({
        usdAmount: 5000000000n,
        tokenPriceUSD: 2500000000n,
        tokenDecimals: 18,
        usdDecimals: 8,
        priceDecimals: 8
      })

      // $50 / $25 = 2 AVAX, with 1% buffer = 1.98 AVAX
      // 1.98 * 10^18 = 1980000000000000000
      expect(result).toBe(1980000000000000000n)
    })
  })

  describe('Benqi-like scenarios', () => {
    it('converts Benqi borrow amount correctly', () => {
      // Benqi: USD with 18 decimals, price scaled by 10^(36-tokenDecimals)
      // For AVAX (18 decimals): price scale = 36 - 18 = 18
      // Available liquidity: $100 (100000000000000000000n with 18 decimals)
      // AVAX price: $25 with 18 decimals scale (25000000000000000000n)
      const result = convertUsdToTokenAmount({
        usdAmount: 100000000000000000000n, // $100 with 18 decimals
        tokenPriceUSD: 25000000000000000000n, // $25 with 18 decimals
        tokenDecimals: 18,
        usdDecimals: 18,
        priceDecimals: 18
      })

      // $100 / $25 = 4 AVAX, with 1% buffer = 3.96 AVAX
      // 3.96 * 10^18 = 3960000000000000000
      expect(result).toBe(3960000000000000000n)
    })
  })
})
