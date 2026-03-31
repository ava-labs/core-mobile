import { renderHook, act } from '@testing-library/react-hooks'
import { calculatePriceImpactFromQuote } from '@avalabs/fusion-sdk'
import type { LocalTokenWithBalance } from 'store/balance'
import type { Quote } from '../types'
import { usePriceImpact, getPriceImpactSeverity } from './usePriceImpact'

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
      let resolve!: (v: number | null) => void
      mockCalculatePriceImpact.mockReturnValue(
        new Promise(res => {
          resolve = res
        })
      )

      const { result, waitFor } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      resolve(null)

      await waitFor(
        () => result.current.priceImpactAvailability === 'unavailable',
        { timeout: 2000 }
      )

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })

    it('returns unavailable when calculatePriceImpactFromQuote throws', async () => {
      let reject!: (e: Error) => void
      mockCalculatePriceImpact.mockReturnValue(
        new Promise((_, rej) => {
          reject = rej
        })
      )

      const { result, waitFor } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      reject(new Error('network error'))

      await waitFor(
        () => result.current.priceImpactAvailability === 'unavailable',
        { timeout: 2000 }
      )

      expect(result.current.priceImpact).toBeUndefined()
      expect(result.current.priceImpactAvailability).toBe('unavailable')
    })
  })

  describe('ready state', () => {
    async function renderAndResolve(bps: number) {
      let resolve!: (v: number | null) => void
      mockCalculatePriceImpact.mockReturnValue(
        new Promise(res => {
          resolve = res
        })
      )

      const { result, waitFor } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      resolve(bps)

      await waitFor(() => result.current.priceImpactAvailability === 'ready', {
        timeout: 2000
      })

      return result
    }

    it('converts basis points to percentage', async () => {
      // 500 bps = 5%
      const result = await renderAndResolve(500)

      expect(result.current.priceImpact).toBe(5)
      expect(result.current.priceImpactAvailability).toBe('ready')
      expect(result.current.priceImpactSeverity).toBe('high')
    })

    it('clamps negative basis points to 0', async () => {
      // negative bps = favorable swap (output worth more than input)
      const result = await renderAndResolve(-200)

      expect(result.current.priceImpact).toBe(0)
      expect(result.current.priceImpactAvailability).toBe('ready')
      expect(result.current.priceImpactSeverity).toBe('low')
    })

    it('returns low severity for impact below 5%', async () => {
      const result = await renderAndResolve(499) // 4.99%

      expect(result.current.priceImpactSeverity).toBe('low')
    })

    it('returns high severity for impact between 5% and 50%', async () => {
      const result = await renderAndResolve(2500) // 25%

      expect(result.current.priceImpactSeverity).toBe('high')
    })

    it('returns critical severity for impact >= 50%', async () => {
      const result = await renderAndResolve(5000) // 50%

      expect(result.current.priceImpactSeverity).toBe('critical')
    })
  })

  describe('cleanup', () => {
    it('does not update state after unmount', async () => {
      let resolve!: (v: number | null) => void
      mockCalculatePriceImpact.mockReturnValue(
        new Promise(res => {
          resolve = res
        })
      )

      const { result, unmount } = renderHook(() =>
        usePriceImpact(makeQuote(), makeToken(1.5), makeToken(1.5))
      )

      expect(result.current.priceImpactAvailability).toBe('calculating')

      unmount()

      await act(async () => {
        resolve(1000)
      })

      // State should remain as 'calculating' — cancelled flag prevents update
      expect(result.current.priceImpactAvailability).toBe('calculating')
    })

    it('ignores stale result when quote changes before promise resolves', async () => {
      let resolveFirst!: (value: number | null) => void
      let resolveSecond!: (value: number | null) => void

      mockCalculatePriceImpact
        .mockReturnValueOnce(
          new Promise(res => {
            resolveFirst = res
          })
        )
        .mockReturnValueOnce(
          new Promise(res => {
            resolveSecond = res
          })
        )

      const quote1 = makeQuote()
      const quote2 = makeQuote()
      const fromToken = makeToken(1.5)
      const toToken = makeToken(1.5)

      const { result, rerender, waitFor } = renderHook(
        ({ quote }) => usePriceImpact(quote, fromToken, toToken),
        { initialProps: { quote: quote1 } }
      )

      // Trigger re-render with new quote — cancels the first calculation
      rerender({ quote: quote2 })

      // Resolve the first (now-cancelled) promise — should not affect state
      resolveFirst(9999)

      // Resolve the second (active) promise with 2%
      resolveSecond(200)

      await waitFor(() => result.current.priceImpactAvailability === 'ready', {
        timeout: 2000
      })

      // Only the second result (2%) should be reflected
      expect(result.current.priceImpact).toBe(2)
      expect(result.current.priceImpactAvailability).toBe('ready')
    })
  })
})
