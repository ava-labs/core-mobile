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
import { useIsFocused } from '@react-navigation/native'
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
  refetchTrendingTokens: () => void
  isRefetchingTopTokens: boolean
  isRefetchingTrendingTokens: boolean
}

export const useWatchlist = (): UseWatchListReturnType => {
  const favoriteIds = useSelector(selectWatchlistFavoriteIds)
  const {
    data: topTokensResponse,
    isLoading: isLoadingTopTokens,
    refetch: refetchTopTokens,
    isRefetching: isRefetchingTopTokens
  } = useGetTokensAndCharts()
  const {
    data: trendingTokensResponse,
    isLoading: isLoadingTrendingTokens,
    refetch: refetchTrendingTokens,
    isRefetching: isRefetchingTrendingTokens
  } = useGetTrendingTokens()
  const isLoading = isLoadingTopTokens || isLoadingTrendingTokens

  const transformedTrendingTokens = useMemo(
    () => transformTrendingTokens(trendingTokensResponse ?? []),
    [trendingTokensResponse]
  )

  const topTokensCoingeckoIds = useMemo(() => {
    return Object.values(topTokensResponse?.tokens ?? {})
      .map(token => token.coingeckoId)
      .filter((id): id is string => typeof id === 'string')
  }, [topTokensResponse?.tokens])

  const isFocused = useIsFocused()

  const { data: topTokenPrices } = useGetPrices({
    coingeckoIds: topTokensCoingeckoIds,
    enabled: isFocused && topTokensCoingeckoIds.length > 0
  })

  // Map prices from coingeckoId back to internalId for consistent access
  const topTokenPricesById = useMemo(() => {
    if (!topTokenPrices || !topTokensResponse?.tokens) {
      return {}
    }

    const pricesById: Prices = {}
    Object.values(topTokensResponse.tokens).forEach(token => {
      const price = token.coingeckoId
        ? topTokenPrices[token.coingeckoId]
        : undefined
      if (price) {
        pricesById[token.id] = price
      }
    })
    return pricesById
  }, [topTokenPrices, topTokensResponse?.tokens])

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
    const seen = new Set<string>()
    const tokens: MarketToken[] = []

    const addUnique = (tokenList?: Record<string, MarketToken>): void => {
      if (!tokenList) return

      // deduplicate tokens with same internal id
      for (const token of Object.values(tokenList)) {
        if (token.id && !seen.has(token.id)) {
          seen.add(token.id)
          tokens.push(token)
        }
      }
    }

    addUnique(transformedTrendingTokens?.tokens)
    addUnique(topTokensResponse?.tokens)

    return tokens
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
      ...topTokenPricesById
    }
  }, [topTokenPricesById, transformedTrendingTokens?.prices])

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
    refetchTrendingTokens,
    isRefetchingTopTokens,
    isRefetchingTrendingTokens
  }
}
