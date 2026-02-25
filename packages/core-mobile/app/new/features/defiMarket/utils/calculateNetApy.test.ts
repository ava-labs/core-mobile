import { calculateNetApy } from './calculateNetApy'

describe('calculateNetApy', () => {
  describe('basic calculations', () => {
    it('should calculate net APY correctly with single deposit and borrow', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 5 }],
        borrows: [{ valueUsd: 500, apyPercent: 10 }]
      })

      // Net worth = 1000 - 500 = 500
      // Supply income = 1000 * 5% = 50
      // Borrow cost = 500 * 10% = 50
      // Net APY = (50 - 50) / 500 * 100 = 0%
      expect(result).toBe(0)
    })

    it('should calculate positive net APY when supply income exceeds borrow cost', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 10 }],
        borrows: [{ valueUsd: 200, apyPercent: 5 }]
      })

      // Net worth = 1000 - 200 = 800
      // Supply income = 1000 * 10% = 100
      // Borrow cost = 200 * 5% = 10
      // Net APY = (100 - 10) / 800 * 100 = 11.25%
      expect(result).toBe(11.25)
    })

    it('should calculate negative net APY when borrow cost exceeds supply income', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 2 }],
        borrows: [{ valueUsd: 500, apyPercent: 15 }]
      })

      // Net worth = 1000 - 500 = 500
      // Supply income = 1000 * 2% = 20
      // Borrow cost = 500 * 15% = 75
      // Net APY = (20 - 75) / 500 * 100 = -11%
      expect(result).toBe(-11)
    })
  })

  describe('multiple deposits and borrows', () => {
    it('should calculate net APY with multiple deposits', () => {
      const result = calculateNetApy({
        deposits: [
          { valueUsd: 1000, apyPercent: 5 },
          { valueUsd: 500, apyPercent: 8 }
        ],
        borrows: [{ valueUsd: 300, apyPercent: 10 }]
      })

      // Net worth = 1500 - 300 = 1200
      // Supply income = 1000 * 5% + 500 * 8% = 50 + 40 = 90
      // Borrow cost = 300 * 10% = 30
      // Net APY = (90 - 30) / 1200 * 100 = 5%
      expect(result).toBe(5)
    })

    it('should calculate net APY with multiple borrows', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 2000, apyPercent: 6 }],
        borrows: [
          { valueUsd: 500, apyPercent: 8 },
          { valueUsd: 300, apyPercent: 12 }
        ]
      })

      // Net worth = 2000 - 800 = 1200
      // Supply income = 2000 * 6% = 120
      // Borrow cost = 500 * 8% + 300 * 12% = 40 + 36 = 76
      // Net APY = (120 - 76) / 1200 * 100 = 3.666...%
      expect(result).toBeCloseTo(3.6667, 4)
    })
  })

  describe('edge cases', () => {
    it('should return undefined when net worth is zero', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 5 }],
        borrows: [{ valueUsd: 1000, apyPercent: 10 }]
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined when net worth is negative', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 500, apyPercent: 5 }],
        borrows: [{ valueUsd: 1000, apyPercent: 10 }]
      })

      expect(result).toBeUndefined()
    })

    it('should handle empty deposits array', () => {
      const result = calculateNetApy({
        deposits: [],
        borrows: [{ valueUsd: 100, apyPercent: 10 }]
      })

      // Net worth = 0 - 100 = -100 (negative)
      expect(result).toBeUndefined()
    })

    it('should handle empty borrows array', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 5 }],
        borrows: []
      })

      // Net worth = 1000
      // Supply income = 50
      // Borrow cost = 0
      // Net APY = 50 / 1000 * 100 = 5%
      expect(result).toBe(5)
    })

    it('should handle both empty arrays', () => {
      const result = calculateNetApy({
        deposits: [],
        borrows: []
      })

      // Net worth = 0 (should return undefined)
      expect(result).toBeUndefined()
    })

    it('should handle zero APY values', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000, apyPercent: 0 }],
        borrows: [{ valueUsd: 500, apyPercent: 0 }]
      })

      // Net worth = 500
      // Supply income = 0
      // Borrow cost = 0
      // Net APY = 0%
      expect(result).toBe(0)
    })

    it('should handle very small values', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 0.01, apyPercent: 5 }],
        borrows: [{ valueUsd: 0.005, apyPercent: 10 }]
      })

      // Net worth = 0.005
      // Supply income = 0.0005
      // Borrow cost = 0.0005
      // Net APY = 0%
      expect(result).toBe(0)
    })

    it('should handle large values', () => {
      const result = calculateNetApy({
        deposits: [{ valueUsd: 1000000, apyPercent: 5 }],
        borrows: [{ valueUsd: 500000, apyPercent: 10 }]
      })

      // Net worth = 500000
      // Supply income = 50000
      // Borrow cost = 50000
      // Net APY = 0%
      expect(result).toBe(0)
    })
  })
})
