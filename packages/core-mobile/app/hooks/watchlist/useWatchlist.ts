import { useCallback, useMemo } from 'react'
import {
  Charts,
  MarketToken,
  MarketType,
  PriceData,
  Prices,
  defaultChartData,
  selectWatchlistFavoriteIds
} from 'store/watchlist'
import { useSelector } from 'react-redux'
import { ChartData } from 'services/token/types'
import { transformTrendingTokens } from 'services/watchlist/utils/transform'
import { useGetPrices } from './useGetPrices'
import { useGetTokensAndCharts } from './useGetTokensAndCharts'
import { useGetTrendingTokens } from './useGetTrendingTokens'

type UseWatchListReturnType = {
  favorites: MarketToken[]
  allTokens: MarketToken[]
  topTokens: MarketToken[]
  trendingTokens: MarketToken[]
  prices: Prices
  charts: Charts
  getWatchlistPrice: (id: string) => PriceData | undefined
  getWatchlistChart: (id: string) => ChartData
  getMarketTokenBySymbol: (symbol: string) => MarketToken | undefined
  getMarketTokenById: (id: string) => MarketToken | undefined
  isLoadingFavorites: boolean
  isLoadingTrendingTokens: boolean
  isLoadingTopTokens: boolean
  refetchTopTokens: () => void
  isRefetchingTopTokens: boolean
}

export const useWatchlist = (): UseWatchListReturnType => {
  const favoriteIds = useSelector(selectWatchlistFavoriteIds)
  const {
    data: topTokensResponse,
    isLoading: isLoadingTopTokens,
    refetch: refetchTopTokens,
    isRefetching: isRefetchingTopTokens
  } = useGetTokensAndCharts()
  const { data: trendingTokensResponse, isLoading: isLoadingTrendingTokens } =
    useGetTrendingTokens()
  const isLoading = isLoadingTopTokens || isLoadingTrendingTokens

  const transformedTrendingTokens = useMemo(
    () => transformTrendingTokens(trendingTokensResponse ?? []),
    [trendingTokensResponse]
  )

  const tokenIds = Object.values(topTokensResponse?.tokens ?? {}).map(
    token => token.id
  )
  const { data: topTokenPrices } = useGetPrices(tokenIds)

  const isLoadingFavorites = favoriteIds.length > 0 && isLoading

  const favorites = useMemo(() => {
    return favoriteIds.reduce((acc, id) => {
      const token =
        topTokensResponse?.tokens[id] ?? transformedTrendingTokens?.tokens[id]

      if (token) {
        acc.push(token)
      }
      return acc
    }, [] as MarketToken[])
  }, [
    topTokensResponse?.tokens,
    transformedTrendingTokens?.tokens,
    favoriteIds
  ])

  const allTokens = useMemo(() => {
    return [
      ...Object.values(transformedTrendingTokens?.tokens ?? {}),
      ...Object.values(topTokensResponse?.tokens ?? {})
    ]
  }, [topTokensResponse?.tokens, transformedTrendingTokens?.tokens])

  const topTokens = useMemo(() => {
    return allTokens.filter(token => token.marketType === MarketType.TOP)
  }, [allTokens])

  const trendingTokens = useMemo(() => {
    return allTokens.filter(token => token.marketType === MarketType.TRENDING)
  }, [allTokens])

  const charts = useMemo(() => {
    return {
      ...topTokensResponse?.charts,
      ...transformedTrendingTokens?.charts
    }
  }, [topTokensResponse?.charts, transformedTrendingTokens?.charts])

  const prices = useMemo(() => {
    return {
      ...transformedTrendingTokens?.prices,
      ...topTokenPrices
    }
  }, [topTokenPrices, transformedTrendingTokens?.prices])

  const getWatchlistPrice = useCallback(
    (id: string): PriceData | undefined => {
      return prices?.[id]
    },
    [prices]
  )

  const getWatchlistChart = useCallback(
    (id: string): ChartData => {
      return charts[id] ?? defaultChartData
    },
    [charts]
  )

  const getMarketTokenBySymbol = useCallback(
    (symbol: string): MarketToken | undefined =>
      allTokens.find(
        token => token.symbol.toLowerCase() === symbol.toLowerCase()
      ),
    [allTokens]
  )

  const getMarketTokenById = useCallback(
    (id: string): MarketToken | undefined =>
      allTokens.find(token => token.id === id),
    [allTokens]
  )

  return {
    favorites,
    allTokens,
    topTokens,
    trendingTokens,
    prices,
    charts,
    getWatchlistPrice,
    getWatchlistChart,
    getMarketTokenBySymbol,
    getMarketTokenById,
    isLoadingFavorites,
    isLoadingTrendingTokens,
    isLoadingTopTokens,
    refetchTopTokens,
    isRefetchingTopTokens
  }
}
