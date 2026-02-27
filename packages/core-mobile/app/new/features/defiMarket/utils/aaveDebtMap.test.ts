import { Address } from 'viem'
import {
  buildActualDebtMap,
  buildVariableBorrowIndexMap,
  RAY_PRECISION,
  ReserveData,
  UserReserveData
} from './aaveDebtMap'

describe('buildVariableBorrowIndexMap', () => {
  it('should build a map of asset addresses to borrow indexes', () => {
    const reservesData: ReserveData[] = [
      {
        underlyingAsset: '0xAAA' as Address,
        variableBorrowIndex: 1050000000000000000000000000n
      },
      {
        underlyingAsset: '0xBBB' as Address,
        variableBorrowIndex: 1100000000000000000000000000n
      }
    ]

    const result = buildVariableBorrowIndexMap(reservesData)

    expect(result.get('0xaaa')).toBe(1050000000000000000000000000n)
    expect(result.get('0xbbb')).toBe(1100000000000000000000000000n)
  })

  it('should lowercase asset addresses', () => {
    const reservesData: ReserveData[] = [
      {
        underlyingAsset: '0xAbCdEf' as Address,
        variableBorrowIndex: RAY_PRECISION
      }
    ]

    const result = buildVariableBorrowIndexMap(reservesData)

    expect(result.has('0xAbCdEf')).toBe(false)
    expect(result.has('0xabcdef')).toBe(true)
  })

  it('should return empty map for empty input', () => {
    const result = buildVariableBorrowIndexMap([])
    expect(result.size).toBe(0)
  })
})

describe('buildActualDebtMap', () => {
  const mockReservesData: ReserveData[] = [
    {
      underlyingAsset: '0xUSDC' as Address,
      variableBorrowIndex: 1050000000000000000000000000n // 1.05 RAY (5% accrued interest)
    },
    {
      underlyingAsset: '0xWAVAX' as Address,
      variableBorrowIndex: 1100000000000000000000000000n // 1.10 RAY (10% accrued interest)
    }
  ]

  describe('basic calculations', () => {
    it('should calculate actual debt with accrued interest', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUSDC' as Address,
          scaledVariableDebt: 1000000000000000000000000000n // 1 RAY (scaled debt)
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      // actualDebt = 1 RAY * 1.05 RAY / RAY = 1.05 RAY
      expect(result.get('0xusdc')).toBe(1050000000000000000000000000n)
    })

    it('should handle multiple user reserves', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUSDC' as Address,
          scaledVariableDebt: 2000000000000000000000000000n // 2 RAY
        },
        {
          underlyingAsset: '0xWAVAX' as Address,
          scaledVariableDebt: 1000000000000000000000000000n // 1 RAY
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      // USDC: 2 RAY * 1.05 = 2.1 RAY
      expect(result.get('0xusdc')).toBe(2100000000000000000000000000n)
      // WAVAX: 1 RAY * 1.10 = 1.1 RAY
      expect(result.get('0xwavax')).toBe(1100000000000000000000000000n)
    })
  })

  describe('edge cases', () => {
    it('should return empty map for empty user reserves', () => {
      const result = buildActualDebtMap([], mockReservesData)
      expect(result.size).toBe(0)
    })

    it('should use RAY_PRECISION as default when reserve data is missing', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUNKNOWN' as Address,
          scaledVariableDebt: 1000000000000000000000000000n // 1 RAY
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      // Should use RAY_PRECISION (1.0) as default index
      // actualDebt = 1 RAY * 1 RAY / RAY = 1 RAY
      expect(result.get('0xunknown')).toBe(1000000000000000000000000000n)
    })

    it('should handle zero scaled debt', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUSDC' as Address,
          scaledVariableDebt: 0n
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      expect(result.get('0xusdc')).toBe(0n)
    })

    it('should lowercase addresses for consistent lookup', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUSDC' as Address, // uppercase
          scaledVariableDebt: 1000000000000000000000000000n
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      // Should find the matching reserve data despite case difference
      expect(result.get('0xusdc')).toBe(1050000000000000000000000000n)
    })
  })

  describe('precision', () => {
    it('should maintain precision with large numbers', () => {
      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xUSDC' as Address,
          scaledVariableDebt: 1000000000000000000000000000000n // 1000 RAY
        }
      ]

      const result = buildActualDebtMap(userReserves, mockReservesData)

      // 1000 RAY * 1.05 = 1050 RAY
      expect(result.get('0xusdc')).toBe(1050000000000000000000000000000n)
    })

    it('should handle fractional results correctly', () => {
      const reservesData: ReserveData[] = [
        {
          underlyingAsset: '0xTEST' as Address,
          variableBorrowIndex: 1333333333333333333333333333n // ~1.333... RAY
        }
      ]

      const userReserves: UserReserveData[] = [
        {
          underlyingAsset: '0xTEST' as Address,
          scaledVariableDebt: 3000000000000000000000000000n // 3 RAY
        }
      ]

      const result = buildActualDebtMap(userReserves, reservesData)

      // 3 RAY * 1.333... RAY / RAY = 3.999... RAY (truncated in bigint division)
      expect(result.get('0xtest')).toBe(3999999999999999999999999999n)
    })
  })
})

describe('RAY_PRECISION', () => {
  it('should be 10^27', () => {
    expect(RAY_PRECISION).toBe(10n ** 27n)
    expect(RAY_PRECISION).toBe(1000000000000000000000000000n)
  })
})
