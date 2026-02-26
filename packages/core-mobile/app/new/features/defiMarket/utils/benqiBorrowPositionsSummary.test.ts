import Big from 'big.js'
import {
  BenqiBorrowData,
  BorrowPosition,
  DefiMarket,
  MarketNames
} from '../types'
import {
  buildBenqiBorrowPositions,
  getBenqiBorrowSummary
} from './benqiBorrowPositionsSummary'

const createMockMarket = (overrides: Partial<DefiMarket> = {}): DefiMarket => ({
  marketName: MarketNames.benqi,
  network: {} as DefiMarket['network'],
  asset: {
    mintTokenAddress: '0xQiToken',
    assetName: 'Test Asset',
    decimals: 8,
    iconUrl: undefined,
    symbol: 'TEST',
    contractAddress: '0xContract',
    mintTokenBalance: {
      balance: 10000000000n, // 100 tokens (8 decimals)
      balanceValue: {
        value: new Big(100),
        valueString: '100',
        currencyCode: 'USD'
      },
      price: {
        value: new Big(1),
        valueString: '1',
        currencyCode: 'USD'
      }
    }
  },
  type: 'lending',
  supplyApyPercent: 5,
  historicalApyPercent: undefined,
  borrowApyPercent: 8,
  historicalBorrowApyPercent: undefined,
  borrowingEnabled: true,
  supplyCapReached: false,
  totalDeposits: undefined,
  uniqueMarketId: 'benqi-test',
  canBeUsedAsCollateral: true,
  usageAsCollateralEnabledOnUser: undefined,
  ...overrides
})

const createMockBenqiBorrowData = (
  overrides: Partial<BenqiBorrowData> = {}
): BenqiBorrowData => ({
  availableBorrowsUSD: 500000000000000000000n, // 500 USD (18 decimals - WAD)
  tokenPriceUSD: 1000000000000000000n, // 1 USD
  totalDebtUSD: 300000000000000000000n, // 300 USD
  liquidity: 200000000000000000000n, // 200 USD (collateral buffer)
  shortfall: 0n,
  ...overrides
})

describe('buildBenqiBorrowPositions', () => {
  describe('basic functionality', () => {
    it('should build positions from markets with debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiUSDC',
          decimals: 8
        }
      })
      const debtMap = new Map([['0xqiusdc', 100000000n]]) // 1 token (8 decimals)

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.borrowedBalance).toBe(100000000n)
      expect(result[0]?.borrowedAmount).toBe(1)
      expect(result[0]?.market).toBe(market)
    })

    it('should filter out markets with zero debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiUSDC'
        }
      })
      const debtMap = new Map([['0xqiusdc', 0n]])

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })

    it('should filter out markets with no matching debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiUSDC'
        }
      })
      const debtMap = new Map([['0xqiother', 100000000n]])

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })

    it('should return empty array when debt map is empty', () => {
      const market = createMockMarket()
      const debtMap = new Map<string, bigint>()

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })
  })

  describe('address matching', () => {
    it('should match mintTokenAddress case-insensitively', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiABCDEF'
        }
      })
      const debtMap = new Map([['0xqiabcdef', 100000000n]])

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
    })
  })

  describe('USD calculation', () => {
    it('should calculate borrowedAmountUsd using market price', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiUSDC',
          decimals: 8,
          mintTokenBalance: {
            ...createMockMarket().asset.mintTokenBalance,
            price: {
              value: new Big(2), // 2 USD per token
              valueString: '2',
              currencyCode: 'USD'
            }
          }
        }
      })
      const debtMap = new Map([['0xqiusdc', 500000000n]]) // 5 tokens

      const result = buildBenqiBorrowPositions({
        markets: [market],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.borrowedAmount).toBe(5)
      expect(result[0]?.borrowedAmountUsd).toBe(10) // 5 * 2 USD
    })
  })

  describe('multiple markets', () => {
    it('should handle multiple markets with different debts', () => {
      const usdcMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiUSDC',
          symbol: 'USDC',
          decimals: 8
        },
        uniqueMarketId: 'benqi-usdc'
      })
      const avaxMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQiAVAX',
          symbol: 'AVAX',
          decimals: 18
        },
        uniqueMarketId: 'benqi-avax'
      })
      const debtMap = new Map([
        ['0xqiusdc', 100000000n], // 1 USDC (8 decimals)
        ['0xqiavax', 500000000000000000n] // 0.5 AVAX (18 decimals)
      ])

      const result = buildBenqiBorrowPositions({
        markets: [usdcMarket, avaxMarket],
        benqiDebtMap: debtMap
      })

      expect(result).toHaveLength(2)
    })
  })
})

describe('getBenqiBorrowSummary', () => {
  const createMockPosition = (
    market: DefiMarket,
    borrowedAmountUsd: number
  ): BorrowPosition => ({
    market,
    borrowedBalance: BigInt(borrowedAmountUsd * 1e8),
    borrowedAmount: borrowedAmountUsd,
    borrowedAmountUsd
  })

  describe('basic functionality', () => {
    it('should return undefined when positions array is empty', () => {
      const result = getBenqiBorrowSummary({
        markets: [createMockMarket()],
        positions: [],
        benqiBorrowData: createMockBenqiBorrowData()
      })

      expect(result).toBeUndefined()
    })

    it('should calculate net worth correctly', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50) // 50 USD borrowed

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData()
      })

      expect(result).toBeDefined()
      // Net worth = 100 (deposit) - 50 (borrow) = 50
      expect(result?.netWorthUsd).toBe(50)
    })
  })

  describe('borrow power calculation', () => {
    it('should calculate borrow power used percentage', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData({
          totalDebtUSD: 300000000000000000000n, // 300 USD
          availableBorrowsUSD: 700000000000000000000n // 700 USD
        })
      })

      // Borrow power used = 300 / (300 + 700) * 100 = 30%
      expect(result?.borrowPowerUsedPercent).toBe(30)
    })

    it('should return 0 when total capacity is 0', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData({
          totalDebtUSD: 0n,
          availableBorrowsUSD: 0n
        })
      })

      expect(result?.borrowPowerUsedPercent).toBe(0)
    })
  })

  describe('health score', () => {
    it('should calculate health score using liquidity formula', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      // Benqi health score = (liquidity + totalDebt) / totalDebt
      // = (200 + 300) / 300 = 1.666...
      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData({
          totalDebtUSD: 300000000000000000000n, // 300 USD
          liquidity: 200000000000000000000n // 200 USD
        })
      })

      expect(result?.healthScore).toBeCloseTo(1.667, 2)
    })

    it('should return undefined health score when debt is 0', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData({
          totalDebtUSD: 0n
        })
      })

      expect(result?.healthScore).toBeUndefined()
    })

    it('should handle high health score (low risk)', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      // High liquidity = high health score
      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData({
          totalDebtUSD: 100000000000000000000n, // 100 USD
          liquidity: 900000000000000000000n // 900 USD
        })
      })

      // Health score = (900 + 100) / 100 = 10
      expect(result?.healthScore).toBe(10)
    })
  })

  describe('net APY calculation', () => {
    it('should calculate net APY using Benqi formula (totalDeposits denominator)', () => {
      const market = createMockMarket({
        supplyApyPercent: 10,
        borrowApyPercent: 5,
        asset: {
          ...createMockMarket().asset,
          mintTokenBalance: {
            ...createMockMarket().asset.mintTokenBalance,
            balanceValue: {
              value: new Big(1000),
              valueString: '1000',
              currencyCode: 'USD'
            }
          }
        }
      })
      const position = createMockPosition(market, 500)

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData()
      })

      // Benqi Net APY formula uses totalDeposits as denominator (not net worth)
      // Supply income = 1000 * 10% = 100
      // Borrow cost = 500 * 5% = 25
      // Net APY = (100 - 25) / 1000 * 100 = 7.5%
      expect(result?.netApyPercent).toBe(7.5)
    })

    it('should return 0 when totalDeposits is 0', () => {
      const market = createMockMarket({
        supplyApyPercent: 10,
        borrowApyPercent: 5,
        asset: {
          ...createMockMarket().asset,
          mintTokenBalance: {
            ...createMockMarket().asset.mintTokenBalance,
            balanceValue: {
              value: new Big(0),
              valueString: '0',
              currencyCode: 'USD'
            }
          }
        }
      })
      const position = createMockPosition(market, 0)

      const result = getBenqiBorrowSummary({
        markets: [market],
        positions: [position],
        benqiBorrowData: createMockBenqiBorrowData()
      })

      expect(result?.netApyPercent).toBe(0)
    })
  })

  describe('multiple markets and positions', () => {
    it('should aggregate values from multiple markets', () => {
      const market1 = createMockMarket({
        supplyApyPercent: 5,
        borrowApyPercent: 10,
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQi1',
          mintTokenBalance: {
            ...createMockMarket().asset.mintTokenBalance,
            balanceValue: {
              value: new Big(500),
              valueString: '500',
              currencyCode: 'USD'
            }
          }
        },
        uniqueMarketId: 'benqi-1'
      })
      const market2 = createMockMarket({
        supplyApyPercent: 8,
        borrowApyPercent: 12,
        asset: {
          ...createMockMarket().asset,
          mintTokenAddress: '0xQi2',
          mintTokenBalance: {
            ...createMockMarket().asset.mintTokenBalance,
            balanceValue: {
              value: new Big(500),
              valueString: '500',
              currencyCode: 'USD'
            }
          }
        },
        uniqueMarketId: 'benqi-2'
      })
      const position1 = createMockPosition(market1, 200)
      const position2 = createMockPosition(market2, 100)

      const result = getBenqiBorrowSummary({
        markets: [market1, market2],
        positions: [position1, position2],
        benqiBorrowData: createMockBenqiBorrowData()
      })

      // Total deposits = 500 + 500 = 1000
      // Total borrows = 200 + 100 = 300
      // Net worth = 1000 - 300 = 700
      expect(result?.netWorthUsd).toBe(700)
    })
  })
})
