import { renderHook, act } from '@testing-library/react-hooks'
import type { TradableMarket } from '@avalabs/prediction-market-sdk'
import { usePredictionsFilter, TRENDING_CHIP } from './usePredictionsFilter'

const makeMarket = (
  tickerId: string,
  category: string,
  volume24h: string,
  expectedExpirationTime: string
): TradableMarket =>
  ({
    tickerId,
    title: tickerId,
    category,
    imageUrl: null,
    openTime: '2024-01-01T00:00:00Z',
    closeTime: '2025-01-01T00:00:00Z',
    expectedExpirationTime,
    volume: '1000.00',
    volume24h,
    kycRequired: false,
    yesQuote: { maxBidPrice: '0.71', minAskPrice: '0.73' },
    noQuote: { maxBidPrice: '0.27', minAskPrice: '0.29' }
  } as TradableMarket)

const markets: TradableMarket[] = [
  makeMarket('M1', 'Finance', '500.00', '2024-06-01T00:00:00Z'),
  makeMarket('M2', 'Politics', '200.00', '2024-03-01T00:00:00Z'),
  makeMarket('M3', 'Finance', '800.00', '2024-09-01T00:00:00Z'),
  makeMarket('M4', 'Sports', '100.00', '2024-02-01T00:00:00Z')
]

describe('usePredictionsFilter — initial state', () => {
  it('selectedChip defaults to Trending', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    expect(result.current.selectedChip).toBe(TRENDING_CHIP)
  })

  it('returns all markets sorted by volume24h desc when Trending is selected', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    const tickers = result.current.filteredMarkets.map(m => m.tickerId)
    expect(tickers).toEqual(['M3', 'M1', 'M2', 'M4'])
  })
})

describe('usePredictionsFilter — category filtering', () => {
  it('filters to matching category when chip is selected', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.selectChip('Finance'))
    const tickers = result.current.filteredMarkets.map(m => m.tickerId)
    expect(tickers).toContain('M1')
    expect(tickers).toContain('M3')
    expect(tickers).not.toContain('M2')
    expect(tickers).not.toContain('M4')
  })

  it('filters to Politics correctly', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.selectChip('Politics'))
    expect(result.current.filteredMarkets.map(m => m.tickerId)).toEqual(['M2'])
  })

  it('returns empty array when no markets match the category', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.selectChip('Crypto'))
    expect(result.current.filteredMarkets).toHaveLength(0)
  })
})

describe('usePredictionsFilter — reset to Trending', () => {
  it('selecting Trending resets to all markets sorted by volume24h', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.selectChip('Finance'))
    act(() => result.current.selectChip(TRENDING_CHIP))
    expect(result.current.selectedChip).toBe(TRENDING_CHIP)
    expect(result.current.filteredMarkets).toHaveLength(4)
    expect(result.current.filteredMarkets[0]?.tickerId).toBe('M3')
  })
})

describe('usePredictionsFilter — sort by expiry', () => {
  it('sortByExpiry sorts ascending by expectedExpirationTime', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.setSortByExpiry(true))
    // M4=Feb, M2=Mar, M1=Jun, M3=Sep
    expect(result.current.filteredMarkets.map(m => m.tickerId)).toEqual([
      'M4',
      'M2',
      'M1',
      'M3'
    ])
  })

  it('sortByExpiry false reverts to volume24h desc', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.setSortByExpiry(true))
    act(() => result.current.setSortByExpiry(false))
    expect(result.current.filteredMarkets[0]?.tickerId).toBe('M3')
  })

  it('sortByExpiry applies within a filtered category', () => {
    const { result } = renderHook(() => usePredictionsFilter(markets))
    act(() => result.current.selectChip('Finance'))
    act(() => result.current.setSortByExpiry(true))
    // M1=Jun, M3=Sep
    expect(result.current.filteredMarkets.map(m => m.tickerId)).toEqual(['M1', 'M3'])
  })
})
