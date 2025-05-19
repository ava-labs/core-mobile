import { useCallback, useEffect, useState, useMemo } from 'react'
import { VsCurrencyType } from '@avalabs/core-coingecko-sdk'
import { useDispatch, useSelector } from 'react-redux'
import {
  MarketToken,
  MarketType,
  selectIsWatchlistFavorite,
  toggleWatchListFavorite
} from 'store/watchlist'
import { InteractionManager } from 'react-native'
import TokenService from 'services/token/TokenService'
import { useWatchlist } from 'hooks/watchlist/useWatchlist'
import { useGetTrendingToken } from 'hooks/watchlist/useGetTrendingTokens'
import { getSocialHandle } from 'utils/getSocialHandle/getSocialHandle'
import { Ranges } from 'services/token/types'
import { selectSelectedCurrency } from 'store/settings/currency'
import { useCoreBrowser } from 'new/common/hooks/useCoreBrowser'
import { getTokenChainId } from 'features/track/utils/utils'

const isTrendingToken = (token: MarketToken | undefined): boolean =>
  token !== undefined && token.marketType === MarketType.TRENDING

type TokenInfo = {
  marketTotalSupply?: number
  twitterHandle: string | undefined
  marketCirculatingSupply?: number
  marketVolume?: number
  marketCap?: number
  marketCapRank?: number
  symbol: string
  name: string
  logoUri: string | undefined
  contractAddress: string | undefined
  urlHostname: string | undefined
  has24hChartDataOnly: boolean
  description?: string
  currentPrice?: number
}

export const useTokenDetails = ({
  marketType,
  tokenId
}: {
  marketType: MarketType
  tokenId: string
}): {
  isFavorite: boolean
  openUrl: ({ url, title }: { url: string; title: string }) => void
  handleFavorite: () => void
  chainId: number | undefined
  coingeckoId: string
  tokenInfo: TokenInfo | undefined
  chartData: { date: Date; value: number }[] | undefined
  ranges: {
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }
  chartDays: number
  changeChartDays: (days: number) => void
  priceInCurrency: number | undefined
  noData: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
} => {
  const { getWatchlistPrice, getMarketTokenById, getWatchlistChart } =
    useWatchlist()
  const { data: trendingTokenData } = useGetTrendingToken(
    marketType === MarketType.TRENDING ? tokenId : undefined
  )
  const token = getMarketTokenById(tokenId)

  // when searching, the token id is actually the coingecko id
  const coingeckoId =
    marketType === MarketType.SEARCH ? tokenId : token?.coingeckoId ?? ''

  const chainId =
    marketType === MarketType.SEARCH ? undefined : getTokenChainId(token)

  const dispatch = useDispatch()
  const isFavorite = useSelector(selectIsWatchlistFavorite(tokenId))
  const { openUrl } = useCoreBrowser()
  const selectedCurrency = useSelector(selectSelectedCurrency)

  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  const [tokenInfo, setTokenInfo] = useState<TokenInfo>()
  const [chartData, setChartData] = useState<{ date: Date; value: number }[]>()
  const [chartDays, setChartDays] = useState(1)
  const [ranges, setRanges] = useState<Ranges>({
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0
  })

  const price = useMemo(() => {
    if (isTrendingToken(token)) {
      return (
        trendingTokenData && {
          priceInCurrency: trendingTokenData.price,
          change24: 0,
          marketCap: trendingTokenData.marketcap ?? 0,
          vol24: trendingTokenData.volume24hUSD ?? 0
        }
      )
    }

    return getWatchlistPrice(tokenId)
  }, [trendingTokenData, getWatchlistPrice, token, tokenId])

  // get chart data
  useEffect(() => {
    const extractChartData = (): void => {
      const chart = getWatchlistChart(tokenId)

      if (chart) {
        setChartData(chart.dataPoints)
        setRanges(chart.ranges)
      } else {
        // simply set to empty to hide the loading state.
        setChartData([])
      }
    }

    const getChartDataFromCoingecko = async (): Promise<void> => {
      const data = await TokenService.getChartDataForCoinId({
        coingeckoId,
        days: chartDays,
        currency
      })

      if (data) {
        setChartData(data.dataPoints)
        setRanges(data.ranges)
      } else {
        // simply set to empty to hide the loading state.
        setChartData([])
      }
    }

    if (coingeckoId) {
      InteractionManager.runAfterInteractions(() => {
        getChartDataFromCoingecko()
      })
    } else {
      InteractionManager.runAfterInteractions(() => {
        extractChartData()
      })
    }
  }, [getWatchlistChart, token, tokenId, chartDays, coingeckoId, currency])

  // get market cap, volume, etc
  useEffect(() => {
    const extractMarketDetails = (): void => {
      trendingTokenData &&
        setTokenInfo({
          twitterHandle: trendingTokenData.twitter
            ? getSocialHandle(trendingTokenData.twitter)
            : undefined,
          marketVolume: trendingTokenData.volume24hUSD ?? undefined,
          marketCap: trendingTokenData.marketcap ?? undefined,
          symbol: trendingTokenData.symbol.toUpperCase(),
          name: trendingTokenData.name,
          logoUri: trendingTokenData.logoURI ?? undefined,
          contractAddress: trendingTokenData.address,
          urlHostname: trendingTokenData.website ?? undefined,
          has24hChartDataOnly: true,
          currentPrice: trendingTokenData.price
        })
    }

    const getMarketDetailsFromCoingecko = async (): Promise<void> => {
      const data = await TokenService.getCoinInfo({
        coingeckoId
      })

      if (!data) return

      setTokenInfo({
        // @ts-ignore total_supply exists in CoinsInfoResponse
        marketTotalSupply: data.market_data.total_supply ?? 0,
        twitterHandle: data.links?.twitter_screen_name ?? undefined,
        marketCirculatingSupply: data.market_data?.circulating_supply ?? 0,
        marketVolume: data.market_data?.total_volume?.[currency] ?? 0,
        marketCap: data.market_data?.market_cap?.[currency] ?? 0,
        marketCapRank: data.market_cap_rank ?? 0,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        logoUri: data.image?.large ?? undefined,
        // @ts-ignore contract_address exists in CoinsInfoResponse
        contractAddress: data.contract_address,
        urlHostname: data?.links?.homepage?.[0],
        has24hChartDataOnly: false,
        description: data.description?.en ?? undefined,
        currentPrice: price?.priceInCurrency
      })
    }

    if (coingeckoId) {
      InteractionManager.runAfterInteractions(() => {
        getMarketDetailsFromCoingecko()
      })
    } else if (isTrendingToken(token)) {
      extractMarketDetails()
    }
  }, [
    coingeckoId,
    currency,
    getWatchlistChart,
    trendingTokenData,
    token,
    tokenId,
    price
  ])

  const handleFavorite = useCallback(() => {
    dispatch(toggleWatchListFavorite(tokenId))
  }, [tokenId, dispatch])

  const changeChartDays = useCallback((days: number) => {
    setChartDays(days)
  }, [])

  return {
    isFavorite,
    coingeckoId,
    chainId,
    openUrl,
    handleFavorite,
    tokenInfo,
    chartData,
    ranges,
    chartDays,
    changeChartDays,
    priceInCurrency: price?.priceInCurrency,
    noData: chartData?.length === 0 && !tokenInfo
  }
}
