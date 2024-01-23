import { useCallback, useEffect, useState } from 'react'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useApplicationContext } from 'contexts/ApplicationContext'
import { VsCurrencyType } from '@avalabs/coingecko-sdk'
import { useDispatch, useSelector } from 'react-redux'
import {
  selectIsWatchlistFavorite,
  selectWatchlistPrice,
  toggleWatchListFavorite
} from 'store/watchlist'
import { InteractionManager } from 'react-native'
import TokenService from 'services/token/TokenService'
import { CoinsInfoResponse } from 'services/token/types'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useTokenDetail(coingeckoId: string) {
  const dispatch = useDispatch()
  const isFavorite = useSelector(selectIsWatchlistFavorite(coingeckoId))
  const price = useSelector(selectWatchlistPrice(coingeckoId))
  const { openMoonPay, openUrl } = useInAppBrowser()
  const { selectedCurrency, currencyFormatter } =
    useApplicationContext().appHook
  const [chartData, setChartData] = useState<{ date: Date; value: number }[]>()
  const [chartDays, setChartDays] = useState(1)
  const [ranges, setRanges] = useState<{
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }>({
    minDate: 0,
    maxDate: 0,
    minPrice: 0,
    maxPrice: 0,
    diffValue: 0,
    percentChange: 0
  })
  const [coinInfo, setCoinInfo] = useState<CoinsInfoResponse>()
  const [urlHostname, setUrlHostname] = useState<string>('')
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  // get coingecko chart data
  useEffect(() => {
    const getChartData = async (): Promise<void> => {
      const data = await TokenService.getChartDataForCoinId({
        coingeckoId,
        days: chartDays,
        currency: currency
      })

      if (data) {
        setChartData(data.dataPoints)
        setRanges(data.ranges)
      } else {
        // Coingecko does not support all tokens chart data. So here we'll
        // simply set to empty to hide the loading state.
        setChartData([])
      }
    }

    InteractionManager.runAfterInteractions(() => {
      getChartData()
    })
  }, [chartDays, coingeckoId, currency])

  // get market cap, volume, etc
  useEffect(() => {
    const getMarketDetails = async (): Promise<void> => {
      const data = await TokenService.getCoinInfo({
        coingeckoId
      })

      if (!data) return

      setCoinInfo(data)

      if (data?.links?.homepage?.[0]) {
        const url = data?.links?.homepage?.[0]
          ?.replace(/^https?:\/\//, '')
          ?.replace('www.', '')
        setUrlHostname(url)
      }
    }

    InteractionManager.runAfterInteractions(() => {
      getMarketDetails()
    })
  }, [coingeckoId])

  const handleFavorite = useCallback(() => {
    dispatch(toggleWatchListFavorite(coingeckoId))
  }, [coingeckoId, dispatch])

  const changeChartDays = useCallback((days: number) => {
    setChartData(undefined)
    setChartDays(days)
  }, [])

  return {
    isFavorite,
    openMoonPay,
    openUrl,
    currencyFormatter,
    urlHostname,
    handleFavorite,
    // @ts-ignore market_data exists in CoinsInfoResponse
    marketTotalSupply: coinInfo?.market_data.total_supply ?? 0,
    twitterHandle: coinInfo?.links?.twitter_screen_name,
    // @ts-ignore market_data exists in CoinsInfoResponse
    marketCirculatingSupply: coinInfo?.market_data?.circulating_supply ?? 0,
    marketVolume:
      // @ts-ignore market_data exists in CoinsInfoResponse
      coinInfo?.market_data?.total_volume[currency] ?? 0,
    // @ts-ignore market_data exists in CoinsInfoResponse
    marketCap: coinInfo?.market_data?.market_cap[currency] ?? 0,
    marketCapRank: coinInfo?.market_cap_rank ?? 0,
    chartData,
    ranges,
    changeChartDays,
    priceInCurrency: price?.priceInCurrency,
    id: coingeckoId,
    symbol: coinInfo?.symbol.toUpperCase(),
    name: coinInfo?.name,
    logoUri: coinInfo?.image?.large,
    // @ts-ignore contract_address exists in CoinsInfoResponse
    contractAddress: coinInfo?.contract_address as string
  }
}
