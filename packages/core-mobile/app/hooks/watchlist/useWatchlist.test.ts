import { renderHook } from '@testing-library/react-hooks'
import { TokenType } from '@avalabs/vm-module-types'
import { LocalTokenWithBalance } from 'store/balance/types'
import { MarketType } from 'store/watchlist'
import { useWatchlist } from './useWatchlist'

jest.mock('react-redux', () => ({
  useSelector: () => []
}))

const mockAvaxMarketToken = {
  id: 'avax',
  internalId: 'avax',
  coingeckoId: 'avalanche-2',
  platforms: {},
  marketType: MarketType.TOP,
  symbol: 'AVAX',
  name: 'Avalanche',
  priceChangePercentage24h: 5
}

jest.mock('./useTopTokens', () => ({
  useTopTokens: () => ({
    data: {
      tokens: { avax: mockAvaxMarketToken },
      charts: {},
      prices: {}
    },
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false
  })
}))

jest.mock('./useGetTrendingTokens', () => ({
  useGetTrendingTokens: () => ({
    data: [],
    isLoading: false,
    refetch: jest.fn(),
    isRefetching: false
  })
}))

describe('useWatchlist (CP-15075 null-symbol crash)', () => {
  describe('getMarketTokenBySymbol', () => {
    it('returns undefined for a null symbol without throwing', () => {
      const { result } = renderHook(() => useWatchlist())

      expect(() =>
        result.current.getMarketTokenBySymbol(null as unknown as string)
      ).not.toThrow()
      expect(
        result.current.getMarketTokenBySymbol(null as unknown as string)
      ).toBeUndefined()
    })

    it('returns undefined for an undefined symbol without throwing', () => {
      const { result } = renderHook(() => useWatchlist())

      expect(
        result.current.getMarketTokenBySymbol(undefined as unknown as string)
      ).toBeUndefined()
    })

    it('returns undefined for an empty string symbol', () => {
      const { result } = renderHook(() => useWatchlist())

      expect(result.current.getMarketTokenBySymbol('')).toBeUndefined()
    })

    it('still matches a normal symbol case-insensitively', () => {
      const { result } = renderHook(() => useWatchlist())

      expect(result.current.getMarketTokenBySymbol('avax')).toEqual(
        mockAvaxMarketToken
      )
      expect(result.current.getMarketTokenBySymbol('AVAX')).toEqual(
        mockAvaxMarketToken
      )
    })
  })

  describe('resolveMarketToken', () => {
    const baseToken = {
      type: TokenType.NATIVE,
      networkChainId: 43114,
      internalId: 'not-a-market-token-id',
      balance: 0n,
      balanceInCurrency: 0,
      priceInCurrency: 0
    } as unknown as LocalTokenWithBalance

    it('returns undefined for a null symbol without throwing', () => {
      const { result } = renderHook(() => useWatchlist())
      const token = {
        ...baseToken,
        symbol: null
      } as unknown as LocalTokenWithBalance

      expect(() => result.current.resolveMarketToken(token)).not.toThrow()
      expect(result.current.resolveMarketToken(token)).toBeUndefined()
    })

    it('returns undefined for an empty string symbol', () => {
      const { result } = renderHook(() => useWatchlist())
      const token = {
        ...baseToken,
        symbol: ''
      } as unknown as LocalTokenWithBalance

      expect(result.current.resolveMarketToken(token)).toBeUndefined()
    })

    it('still matches a normal symbol case-insensitively', () => {
      const { result } = renderHook(() => useWatchlist())
      const token = {
        ...baseToken,
        symbol: 'avax'
      } as unknown as LocalTokenWithBalance

      expect(result.current.resolveMarketToken(token)).toEqual(
        mockAvaxMarketToken
      )
    })

    it('still matches by internalId when symbol is null', () => {
      const { result } = renderHook(() => useWatchlist())
      const token = {
        ...baseToken,
        internalId: 'avax',
        symbol: null
      } as unknown as LocalTokenWithBalance

      expect(result.current.resolveMarketToken(token)).toEqual(
        mockAvaxMarketToken
      )
    })
  })
})
