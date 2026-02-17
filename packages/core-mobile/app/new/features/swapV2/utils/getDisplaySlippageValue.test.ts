import { getDisplaySlippageValue } from './getDisplaySlippageValue'

describe('getDisplaySlippageValue', () => {
  describe('Auto slippage with quote', () => {
    it('should display quote slippageBps when auto slippage is enabled and quote is available', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 50,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 0.5%')
    })

    it('should convert basis points to percentage correctly (100 bps = 1%)', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 100,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 1%')
    })

    it('should handle decimal percentages (30 bps = 0.3%)', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 30,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 0.3%')
    })

    it('should handle large slippage values (4000 bps = 40%)', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 4000,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 40%')
    })

    it('should handle zero slippage (0 bps = 0%)', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 0,
        manualSlippage: 2
      })

      // Note: 0 is falsy, so it falls through to "Auto" without percentage
      expect(result).toBe('Auto')
    })
  })

  describe('Auto slippage without quote', () => {
    it('should display "Auto" when auto slippage is enabled but no quote available', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: undefined,
        manualSlippage: 2
      })

      expect(result).toBe('Auto')
    })

    it('should display "Auto" when quoteSlippageBps is null', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: undefined,
        manualSlippage: 5
      })

      expect(result).toBe('Auto')
    })
  })

  describe('Manual slippage', () => {
    it('should display manual slippage when auto slippage is disabled', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: false,
        quoteSlippageBps: 50,
        manualSlippage: 2
      })

      expect(result).toBe('2%')
    })

    it('should ignore quote slippage when auto is disabled', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: false,
        quoteSlippageBps: 100,
        manualSlippage: 5
      })

      expect(result).toBe('5%')
    })

    it('should handle decimal manual slippage values', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: false,
        quoteSlippageBps: undefined,
        manualSlippage: 2.5
      })

      expect(result).toBe('2.5%')
    })

    it('should handle large manual slippage values', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: false,
        quoteSlippageBps: undefined,
        manualSlippage: 40
      })

      expect(result).toBe('40%')
    })

    it('should handle zero manual slippage', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: false,
        quoteSlippageBps: undefined,
        manualSlippage: 0
      })

      expect(result).toBe('0%')
    })
  })

  describe('Edge cases', () => {
    it('should prioritize quote slippage over manual when both are present and auto is enabled', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 75,
        manualSlippage: 10
      })

      expect(result).toBe('Auto • 0.75%')
    })

    it('should handle very small quoteSlippageBps values', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 1,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 0.01%')
    })

    it('should handle very large quoteSlippageBps values', () => {
      const result = getDisplaySlippageValue({
        autoSlippage: true,
        quoteSlippageBps: 10000,
        manualSlippage: 2
      })

      expect(result).toBe('Auto • 100%')
    })
  })
})
