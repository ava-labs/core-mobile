import Big from 'big.js'
import { CurrencyCode } from '@avalabs/glacier-sdk'
import {
  AaveBorrowData,
  BorrowPosition,
  DefiMarket,
  MarketNames
} from '../types'
import { AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS } from '../consts'
import {
  buildAaveBorrowPositions,
  getAaveBorrowSummary
} from './aaveBorrowPositionsSummary'

const createMockMarket = (overrides: Partial<DefiMarket> = {}): DefiMarket => ({
  marketName: MarketNames.aave,
  network: {} as DefiMarket['network'],
  asset: {
    mintTokenAddress: '0xMintToken',
    assetName: 'Test Asset',
    decimals: 18,
    iconUrl: undefined,
    symbol: 'TEST',
    contractAddress: '0xContract',
    mintTokenBalance: {
      balance: 1000000000000000000n,
      balanceValue: {
        value: new Big(100),
        valueString: '100',
        currencyCode: CurrencyCode.USD
      },
      price: {
        value: new Big(1),
        valueString: '1',
        currencyCode: CurrencyCode.USD
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
  uniqueMarketId: 'aave-test',
  canBeUsedAsCollateral: true,
  usageAsCollateralEnabledOnUser: true,
  ...overrides
})

const createMockAaveBorrowData = (
  overrides: Partial<AaveBorrowData> = {}
): AaveBorrowData => ({
  availableBorrowsUSD: 50000000000n, // 500 USD (8 decimals)
  tokenPriceUSD: 100000000n, // 1 USD
  totalDebtUSD: 30000000000n, // 300 USD
  healthFactor: 1500000000000000000n, // 1.5 (18 decimals)
  totalCollateralUSD: 100000000000n, // 1000 USD
  liquidationThreshold: 8000n, // 80%
  ...overrides
})

describe('buildAaveBorrowPositions', () => {
  describe('basic functionality', () => {
    it('should build positions from markets with debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xUSDC',
          decimals: 6
        }
      })
      const debtMap = new Map([['0xusdc', 1000000n]]) // 1 USDC

      const result = buildAaveBorrowPositions({
        markets: [market],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.borrowedBalance).toBe(1000000n)
      expect(result[0]?.borrowedAmount).toBe(1)
      expect(result[0]?.market).toBe(market)
    })

    it('should return empty array when debt map is undefined', () => {
      const market = createMockMarket()

      const result = buildAaveBorrowPositions({
        markets: [market],
        aaveDebtMap: undefined
      })

      expect(result).toHaveLength(0)
    })

    it('should filter out markets with zero debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xUSDC'
        }
      })
      const debtMap = new Map([['0xusdc', 0n]])

      const result = buildAaveBorrowPositions({
        markets: [market],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })

    it('should filter out markets with no matching debt', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xUSDC'
        }
      })
      const debtMap = new Map([['0xother', 1000000n]])

      const result = buildAaveBorrowPositions({
        markets: [market],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })
  })

  describe('WAVAX handling', () => {
    it('should skip WAVAX market', () => {
      const wavaxMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS
        }
      })
      const debtMap = new Map([
        [AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS.toLowerCase(), 1000000000000000000n]
      ])

      const result = buildAaveBorrowPositions({
        markets: [wavaxMarket],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(0)
    })

    it('should use WAVAX address for native AVAX market (no contractAddress)', () => {
      const avaxMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: undefined,
          symbol: 'AVAX'
        }
      })
      const debtMap = new Map([
        [AAVE_WRAPPED_AVAX_C_CHAIN_ADDRESS.toLowerCase(), 1000000000000000000n]
      ])

      const result = buildAaveBorrowPositions({
        markets: [avaxMarket],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
      expect(result[0]?.borrowedBalance).toBe(1000000000000000000n)
    })
  })

  describe('address matching', () => {
    it('should match addresses case-insensitively', () => {
      const market = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xABCDEF'
        }
      })
      const debtMap = new Map([['0xabcdef', 1000000000000000000n]])

      const result = buildAaveBorrowPositions({
        markets: [market],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(1)
    })
  })

  describe('multiple markets', () => {
    it('should handle multiple markets with different debts', () => {
      const usdcMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xUSDC',
          symbol: 'USDC',
          decimals: 6
        },
        uniqueMarketId: 'aave-usdc'
      })
      const wethMarket = createMockMarket({
        asset: {
          ...createMockMarket().asset,
          contractAddress: '0xWETH',
          symbol: 'WETH',
          decimals: 18
        },
        uniqueMarketId: 'aave-weth'
      })
      const debtMap = new Map([
        ['0xusdc', 1000000n], // 1 USDC
        ['0xweth', 500000000000000000n] // 0.5 WETH
      ])

      const result = buildAaveBorrowPositions({
        markets: [usdcMarket, wethMarket],
        aaveDebtMap: debtMap
      })

      expect(result).toHaveLength(2)
    })
  })
})

describe('getAaveBorrowSummary', () => {
  const createMockPosition = (
    market: DefiMarket,
    borrowedAmountUsd: number
  ): BorrowPosition => ({
    market,
    borrowedBalance: BigInt(borrowedAmountUsd * 1e6),
    borrowedAmount: borrowedAmountUsd,
    borrowedAmountUsd
  })

  describe('basic functionality', () => {
    it('should return undefined when positions array is empty', () => {
      const result = getAaveBorrowSummary({
        markets: [createMockMarket()],
        positions: [],
        aaveBorrowData: createMockAaveBorrowData()
      })

      expect(result).toBeUndefined()
    })

    it('should calculate summary correctly', () => {
      const market = createMockMarket({
        supplyApyPercent: 5,
        borrowApyPercent: 10
      })
      const position = createMockPosition(market, 50) // 50 USD borrowed

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData()
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

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData({
          totalDebtUSD: 30000000000n, // 300 USD
          availableBorrowsUSD: 70000000000n // 700 USD
        })
      })

      // Borrow power used = 300 / (300 + 700) * 100 = 30%
      expect(result?.borrowPowerUsedPercent).toBe(30)
    })

    it('should return 0 when total capacity is 0', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData({
          totalDebtUSD: 0n,
          availableBorrowsUSD: 0n
        })
      })

      expect(result?.borrowPowerUsedPercent).toBe(0)
    })
  })

  describe('health score', () => {
    it('should return health score when debt exists', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData({
          healthFactor: 2000000000000000000n // 2.0
        })
      })

      expect(result?.healthScore).toBe(2)
    })

    it('should return undefined health score when debt is 0', () => {
      const market = createMockMarket()
      const position = createMockPosition(market, 50)

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData({
          totalDebtUSD: 0n
        })
      })

      expect(result?.healthScore).toBeUndefined()
    })
  })

  describe('net APY calculation', () => {
    it('should calculate net APY using AAVE formula (net worth denominator)', () => {
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
              currencyCode: CurrencyCode.USD
            }
          }
        }
      })
      const position = createMockPosition(market, 500)

      const result = getAaveBorrowSummary({
        markets: [market],
        positions: [position],
        aaveBorrowData: createMockAaveBorrowData()
      })

      // Supply income = 1000 * 10% = 100
      // Borrow cost = 500 * 5% = 25
      // Net worth = 1000 - 500 = 500
      // Net APY = (100 - 25) / 500 * 100 = 15%
      expect(result?.netApyPercent).toBe(15)
    })
  })
})
