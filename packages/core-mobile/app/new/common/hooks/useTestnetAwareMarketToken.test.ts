import { renderHook } from '@testing-library/react-hooks'
import { MarketToken } from 'store/watchlist'
import {
  useTestnetAwareGetMarketTokenBySymbol,
  useTestnetAwareMarketTokenBySymbol
} from './useTestnetAwareMarketToken'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockState = { isDeveloperMode: false }

const AVAX = { symbol: 'AVAX', currentPrice: 25 } as MarketToken

const mockGetMarketTokenBySymbol = jest.fn(
  (symbol: string): MarketToken | undefined =>
    symbol.toLowerCase() === 'avax' ? AVAX : undefined
)

jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector(mockState)
}))

jest.mock('store/settings/advanced', () => ({
  selectIsDeveloperMode: (state: { isDeveloperMode: boolean }) =>
    state.isDeveloperMode
}))

jest.mock('hooks/watchlist/useWatchlist', () => ({
  useWatchlist: () => ({
    getMarketTokenBySymbol: mockGetMarketTokenBySymbol
  })
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestnetAwareMarketToken', () => {
  beforeEach(() => {
    mockState.isDeveloperMode = false
    jest.clearAllMocks()
  })

  describe('useTestnetAwareMarketTokenBySymbol', () => {
    it('returns the market token on mainnet', () => {
      const { result } = renderHook(() =>
        useTestnetAwareMarketTokenBySymbol({ symbol: 'AVAX' })
      )

      expect(result.current).toBe(AVAX)
    })

    it('returns undefined in developer mode so no fiat value is priced', () => {
      mockState.isDeveloperMode = true

      const { result } = renderHook(() =>
        useTestnetAwareMarketTokenBySymbol({ symbol: 'AVAX' })
      )

      expect(result.current).toBeUndefined()
    })

    it('returns undefined for an unknown symbol on mainnet', () => {
      const { result } = renderHook(() =>
        useTestnetAwareMarketTokenBySymbol({ symbol: 'NOPE' })
      )

      expect(result.current).toBeUndefined()
    })

    it('returns undefined when no symbol is given', () => {
      const { result } = renderHook(() =>
        useTestnetAwareMarketTokenBySymbol({ symbol: undefined })
      )

      expect(result.current).toBeUndefined()
    })
  })

  describe('useTestnetAwareGetMarketTokenBySymbol', () => {
    it('resolves the market token on mainnet', () => {
      const { result } = renderHook(() =>
        useTestnetAwareGetMarketTokenBySymbol()
      )

      expect(result.current('AVAX')).toBe(AVAX)
    })

    it('resolves undefined in developer mode', () => {
      mockState.isDeveloperMode = true

      const { result } = renderHook(() =>
        useTestnetAwareGetMarketTokenBySymbol()
      )

      expect(result.current('AVAX')).toBeUndefined()
    })

    it('does not consult the watchlist at all in developer mode', () => {
      mockState.isDeveloperMode = true

      const { result } = renderHook(() =>
        useTestnetAwareGetMarketTokenBySymbol()
      )
      result.current('AVAX')

      expect(mockGetMarketTokenBySymbol).not.toHaveBeenCalled()
    })

    it('returns a new getter when developer mode is toggled', () => {
      const { result, rerender } = renderHook(() =>
        useTestnetAwareGetMarketTokenBySymbol()
      )
      const mainnetGetter = result.current

      mockState.isDeveloperMode = true
      rerender()

      expect(result.current).not.toBe(mainnetGetter)
      expect(result.current('AVAX')).toBeUndefined()
    })
  })
})
