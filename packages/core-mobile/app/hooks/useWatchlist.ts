import { useCallback, useMemo } from 'react'
import {
  Charts,
  MarketToken,
  PriceData,
  Prices,
  defaultChartData,
  selectWatchlistFavoriteIds
} from 'store/watchlist'
import { useSelector } from 'react-redux'
import { ChartData } from 'services/token/types'
import { useGetPrices } from './useGetPrices'
import { useGetTokensAndCharts } from './useGetTokensAndCharts'

type UseWatchListReturnType = {
  favorites: MarketToken[]
  tokens: MarketToken[]
  prices: Prices
  charts: Charts
  getWatchlistPrice: (coingeckoId: string) => PriceData | undefined
  getWatchlistChart: (coingeckoId: string) => ChartData
  getMarketToken: (symbol: string) => MarketToken | undefined
}

export const useWatchlist = (): UseWatchListReturnType => {
  const favoriteIds = useSelector(selectWatchlistFavoriteIds)
  const { data } = useGetTokensAndCharts()
  const tokenIds = Object.values(data?.tokens ?? {}).map(token => token.id)
  const { data: prices } = useGetPrices(tokenIds)

  const favorites = useMemo(() => {
    return favoriteIds.reduce((acc, id) => {
      const token = data?.tokens[id]
      if (token) {
        acc.push(token)
      }
      return acc
    }, [] as MarketToken[])
  }, [data?.tokens, favoriteIds])

  const tokens = useMemo(() => {
    return Object.values(data?.tokens ?? {})
  }, [data?.tokens])

  const getWatchlistPrice = useCallback(
    (coingeckoId: string): PriceData | undefined => {
      return prices?.[coingeckoId]
    },
    [prices]
  )

  const getWatchlistChart = useCallback(
    (coingeckoId: string): ChartData => {
      return data?.charts[coingeckoId] ?? defaultChartData
    },
    [data?.charts]
  )

  const getMarketToken = useCallback(
    (symbol: string): MarketToken | undefined =>
      tokens.find(token => token.symbol.toLowerCase() === symbol.toLowerCase()),
    [tokens]
  )

  return {
    favorites,
    tokens,
    prices: prices ?? {},
    charts: data?.charts ?? {},
    getWatchlistPrice,
    getWatchlistChart,
    getMarketToken
  }
}
