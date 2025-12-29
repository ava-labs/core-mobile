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
import { LocalTokenWithBalance } from 'store/balance/types'
import { getCaip2ChainIdForToken } from 'utils/caip2ChainIds'
import { isNetworkContractToken } from 'utils/isNetworkContractToken'
import { useGetPrices } from './useGetPrices'
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

  const { allTokens, tokensById, tokensByPlatform, tokensBySymbol } =
    // eslint-disable-next-line sonarjs/cognitive-complexity
    useMemo(() => {
      const seen = new Set<string>()
      const tokens: MarketToken[] = []
      const byId = new Map<string, MarketToken>()
      const byPlatform = new Map<string, MarketToken>()
      const bySymbol = new Map<string, MarketToken>()

      const addUnique = (tokenList?: Record<string, MarketToken>): void => {
        if (!tokenList) return

        // deduplicate tokens with same internal id
        for (const token of Object.values(tokenList)) {
          if (token.id && !seen.has(token.id)) {
            seen.add(token.id)
            tokens.push(token)
            byId.set(token.id, token)

            // Populate platform map
            if (token.platforms) {
              for (const [chainId, address] of Object.entries(
                token.platforms
              )) {
                if (address) {
                  byPlatform.set(`${chainId}:${address.toLowerCase()}`, token)
                }
              }
            }

            // Populate symbol map (last one wins if duplicates, which matches find behavior generally)
            // Ideally we might want prioritized symbol matching but standard map set is fine for now
            // as we use it as a fallback.
            const symbolKey = token.symbol.toLowerCase().trim()
            if (!bySymbol.has(symbolKey)) {
              bySymbol.set(symbolKey, token)
            }
          }
        }
      }

      addUnique(transformedTrendingTokens?.tokens)
      addUnique(topTokensResponse?.tokens)

      return {
        allTokens: tokens,
        tokensById: byId,
        tokensByPlatform: byPlatform,
        tokensBySymbol: bySymbol
      }
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
    (symbol: string): MarketToken | undefined => {
      const targetSymbol = symbol.toLowerCase().trim()
      return tokensBySymbol.get(targetSymbol)
    },
    [tokensBySymbol]
  )

  const getMarketTokenById = useCallback(
    (id: string): MarketToken | undefined => tokensById.get(id),
    [tokensById]
  )

  const resolveMarketToken = useCallback(
    (token: LocalTokenWithBalance): MarketToken | undefined => {
      // 1. Try match by internal ID
      if (token.internalId) {
        const match = tokensById.get(token.internalId)
        if (match) return match
      }

      // 2. Try match by contract address (platform)
      if (isNetworkContractToken(token)) {
        const caip2ChainId = getCaip2ChainIdForToken({
          type: token.type,
          chainId: token.networkChainId
        })
        const address = token.address.toLowerCase()
        const match = tokensByPlatform.get(`${caip2ChainId}:${address}`)
        if (match) return match
      }

      // 3. Fallback to symbol match
      const targetSymbol = token.symbol.toLowerCase().trim()
      return tokensBySymbol.get(targetSymbol)
    },
    [tokensById, tokensByPlatform, tokensBySymbol]
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
