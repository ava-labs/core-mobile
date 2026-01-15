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
import { LocalTokenWithBalance } from 'store/balance/types'
import { getCaip2ChainIdForToken } from 'utils/caip2ChainIds'
import { isNetworkContractToken } from 'utils/isNetworkContractToken'
import { useTopTokens } from './useTopTokens'
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
  resolveMarketToken: (token: LocalTokenWithBalance) => MarketToken | undefined
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
  } = useTopTokens()
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
      ...topTokensResponse?.prices
    }
  }, [topTokensResponse?.prices, transformedTrendingTokens?.prices])

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
    (symbol: string): MarketToken | undefined => {
      const targetSymbol = symbol.toLowerCase().trim()

      return allTokens.find(
        marketToken => marketToken.symbol.toLowerCase().trim() === targetSymbol
      )
    },
    [allTokens]
  )

  const getMarketTokenById = useCallback(
    (id: string): MarketToken | undefined =>
      allTokens.find(token => token.id === id),
    [allTokens]
  )

  const resolveMarketToken = useCallback(
    (token: LocalTokenWithBalance): MarketToken | undefined => {
      const caip2ChainId = getCaip2ChainIdForToken({
        type: token.type,
        chainId: token.networkChainId
      })
      const contractTokenAddress = isNetworkContractToken(token)
        ? token.address.toLowerCase()
        : undefined
      const targetSymbol = token.symbol.toLowerCase().trim()

      return allTokens.find(marketToken => {
        // First try to match by internal id
        if (token.internalId === marketToken.id) {
          return true
        }

        // Next try to match by contract address if possible
        if (
          contractTokenAddress &&
          marketToken.platforms?.[caip2ChainId]?.toLowerCase() ===
            contractTokenAddress
        ) {
          return true
        }

        // Finally, fallback to matching by symbol (not ideal, but better than nothing)
        return marketToken.symbol.toLowerCase().trim() === targetSymbol
      })
    },
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
    resolveMarketToken,
    isLoadingFavorites,
    isLoadingTrendingTokens,
    isLoadingTopTokens,
    refetchTopTokens,
    refetchTrendingTokens,
    isRefetchingTopTokens,
    isRefetchingTrendingTokens
  }
}
