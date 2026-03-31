import { renderHook, act } from '@testing-library/react-hooks'
import { calculatePriceImpactFromQuote } from '@avalabs/fusion-sdk'
import { usePriceImpact, getPriceImpactSeverity } from './usePriceImpact'
import type { Quote } from '../types'
import type { LocalTokenWithBalance } from 'store/balance'

jest.mock('@avalabs/fusion-sdk', () => ({
  calculatePriceImpactFromQuote: jest.fn()
}))

jest.mock('@avalabs/core-utils-sdk', () => ({
  bigintToBig: jest.fn((amount: bigint, decimals: number) => ({
    toNumber: () => Number(amount) / Math.pow(10, decimals)
  }))
}))

const mockCalculatePriceImpact =
  calculatePriceImpactFromQuote as jest.MockedFunction<
    typeof calculatePriceImpactFromQuote
  >

const makeQuote = (): Quote =>
  ({
    amountIn: 1000000n,
    amountOut: 900000n,
    assetIn: { decimals: 6 },
    assetOut: { decimals: 6 },
    fees: [],
    targetChain: 'eip155:43114'
  } as unknown as Quote)

const makeToken = (
  priceInCurrency: number | undefined
): LocalTokenWithBalance =>
  ({
    priceInCurrency
  } as unknown as LocalTokenWithBalance)

/** Flush all pending microtasks and macrotasks */
const flushPromises = (): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, 0))

describe('getPriceImpactSeverity', () => {
  it('returns low when priceImpact is undefined', () => {
    expect(getPriceImpactSeverity(undefined)).toBe('low')
  })

  it('returns low when priceImpact is 0', () => {
    expect(getPriceImpactSeverity(0)).toBe('low')
  })

  it('returns low when priceImpact is below HIGH threshold (< 5)', () => {
    expect(getPriceImpactSeverity(4.99)).toBe('low')
  })

  it('returns high when priceImpact equals HIGH threshold (5)', () => {
    expect(getPriceImpactSeverity(5)).toBe('high')
  })

  it('returns high when priceImpact is between 5 and 50', () => {
    expect(getPriceImpactSeverity(25)).toBe('high')
    expect(getPriceImpactSeverity(49.99)).toBe('high')
  })

  it('returns critical when priceImpact equals CRITICAL threshold (50)', () => {
    expect(getPriceImpactSeverity(50)).toBe('critical')
  })

  it('returns critical when priceImpact exceeds CRITICAL threshold', () => {
    expect(getPriceImpactSeverity(99)).toBe('critical')
  })
})

describe('usePriceImpact', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('hidden state', () => {
    it('returns hidden when quote is null', () => {
      const { result } = renderHook(() =>
        usePriceImpact(null, makeToken(1.5), makeToken(1.5))
      )

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('hidden')
      expect(result.current.priceImpactSeverity).toBe('low')
    })

    it('returns hidden when quote is undefined', () => {
      const { result } = renderHook(() =>
        usePriceImpact(undefined, makeToken(1.5), makeToken(1.5))
      )

      expect(result.current.priceImpactAvailability).toBe('hidden')
    })

    it('returns hidden when fromToken is undefined', () => {
      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), undefined, makeToken(1.5))
      )

      expect(result.current.priceImpactAvailability).toBe('hidden')
    })

    it('returns hidden when toToken is undefined', () => {
      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), undefined)
      )

      expect(result.current.priceImpactAvailability).toBe('hidden')
    })
  })

  describe('unavailable state', () => {
    it('returns unavailable when fromToken has no price', () => {
      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(undefined), makeToken(1.5))
      )

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })

    it('returns unavailable when toToken has no price', () => {
      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(undefined))
      )

      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })

    it('returns unavailable when calculatePriceImpactFromQuote returns null', async () => {
      mockCalculatePriceImpact.mockResolvedValue(null)

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })

    it('returns unavailable when calculatePriceImpactFromQuote throws', async () => {
      mockCalculatePriceImpact.mockRejectedValue(new Error('network error'))

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })
  })

  describe('ready state', () => {
    it('converts basis points to percentage', async () => {
      // 500 bps = 5%
      mockCalculatePriceImpact.mockResolvedValue(500)

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpact).toBe(5)
      expect(result.current.priceImpactAvailability).toBe('ready')
      expect(result.current.priceImpactSeverity).toBe('high')
    })

    it('clamps negative basis points to 0', async () => {
      // negative bps = favorable swap (output worth more than input)
      mockCalculatePriceImpact.mockResolvedValue(-200)

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpact).toBe(0)
      expect(result.current.priceImpactAvailability).toBe('ready')
      expect(result.current.priceImpactSeverity).toBe('low')
    })

    it('returns low severity for impact below 5%', async () => {
      mockCalculatePriceImpact.mockResolvedValue(499) // 4.99%

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpactSeverity).toBe('low')
    })

    it('returns high severity for impact between 5% and 50%', async () => {
      mockCalculatePriceImpact.mockResolvedValue(2500) // 25%

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpactSeverity).toBe('high')
    })

    it('returns critical severity for impact >= 50%', async () => {
      mockCalculatePriceImpact.mockResolvedValue(5000) // 50%

      const { result } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      await act(flushPromises)

      expect(result.current.priceImpactSeverity).toBe('critical')
    })
  })

  describe('cleanup', () => {
    it('does not update state after unmount', async () => {
      let resolveImpact!: (value: number | null) => void
      mockCalculatePriceImpact.mockReturnValue(
        new Promise(resolve => {
          resolveImpact = resolve
        })
      )

      const { result, unmount } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      expect(result.current.priceImpactAvailability).toBe('calculating')

      unmount()

      await act(async () => {
        resolveImpact(1000)
        await flushPromises()
      })

      // State should remain as 'calculating' — cancelled flag prevents update
      expect(result.current.priceImpactAvailability).toBe('calculating')
    })

    it('ignores stale result when quote changes before promise resolves', async () => {
      let resolveFirst!: (value: number | null) => void
      mockCalculatePriceImpact
        .mockReturnValueOnce(
          new Promise(resolve => {
            resolveFirst = resolve
          })
        )
        .mockResolvedValue(200) // 2% for second call

      const quote1 = makeQuote()
      const quote2 = makeQuote()
      const fromToken = makeToken(1.5)
      const toToken = makeToken(1.5)

      const { result, rerender } = renderHook(
        ({ quote }) => usePriceImpact(quote, fromToken, toToken),
        { initialProps: { quote: quote1 } }
      )

      // Trigger re-render with new quote — cancels the first calculation
      rerender({ quote: quote2 })

      // Let the second promise resolve
      await act(flushPromises)

      // Resolve the first (now-cancelled) promise — should not affect state
      await act(async () => {
        resolveFirst(9999)
        await flushPromises()
      })

      // Only the second result (2%) should be reflected
      expect(result.current.priceImpact).toBe(2)
      expect(result.current.priceImpactAvailability).toBe('ready')
    })
  })
})
