import { useEffect, useState } from 'react'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  CoinsContractInfoResponse,
  CoinsInfoResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { TokenType } from 'store/balance'
import { useDispatch, useSelector } from 'react-redux'
import TokenService from 'services/token/TokenService'
import { selectActiveNetwork } from 'store/network'
import {
  selectIsWatchlistFavorite,
  selectWatchlistTokenById,
  toggleWatchListFavorite
} from 'store/watchlist'

export function useTokenDetail(tokenId: string) {
  const dispatch = useDispatch()
  const isFavorite = useSelector(selectIsWatchlistFavorite(tokenId))
  const { openMoonPay, openUrl } = useInAppBrowser()
  const { selectedCurrency, currencyFormatter } =
    useApplicationContext().appHook
  const [chartData, setChartData] = useState<{ x: number; y: number }[]>()
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
  const [contractInfo, setContractInfo] = useState<
    CoinsContractInfoResponse | CoinsInfoResponse
  >()
  const [urlHostname, setUrlHostname] = useState<string>('')
  const token = useSelector(selectWatchlistTokenById(tokenId))
  const network = useSelector(selectActiveNetwork)
  const assetPlatformId =
    network.pricingProviders?.coingecko.assetPlatformId ?? ''
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  // get coingecko chart data.
  useEffect(() => {
    ;(async () => {
      let data

      if (token?.type === TokenType.NATIVE) {
        data = await TokenService.getChartDataForCoinId({
          coingeckoId: token?.coingeckoId,
          days: chartDays,
          currency: currency
        })
      } else if (token?.type === TokenType.ERC20) {
        data = await TokenService.getChartDataForAddress({
          assetPlatformId,
          address: token?.address,
          days: chartDays,
          currency: currency
        })
      }

      if (data) {
        setChartData(data.dataPoints)
        setRanges(data.ranges)
      } else {
        // Coingecko does not support all tokens chart data. So here we'll
        // simply set to empty to hide the loading state.
        setChartData([])
      }
    })()
  }, [assetPlatformId, chartDays, currency, token])

  // get market cap, volume, etc
  useEffect(() => {
    ;(async () => {
      let data

      if (token?.type === TokenType.NATIVE) {
        data = await TokenService.getCoinInfo({
          coingeckoId: token?.coingeckoId
        })
      } else if (token?.type === TokenType.ERC20) {
        data = await TokenService.getContractInfo({
          assetPlatformId,
          address: token?.address
        })
      }

      if (!data) return

      setContractInfo(data)

      if (data?.links?.homepage?.[0]) {
        const url = data?.links?.homepage?.[0]
          ?.replace(/^https?:\/\//, '')
          ?.replace('www.', '')
        setUrlHostname(url)
      }
    })()
  }, [assetPlatformId, token])

  function handleFavorite() {
    dispatch(toggleWatchListFavorite(tokenId))
  }

  async function changeChartDays(days: number) {
    setChartData(undefined)
    setChartDays(days)
  }

  return {
    isFavorite,
    openMoonPay,
    openUrl,
    currencyFormatter,
    contractInfo,
    urlHostname,
    handleFavorite,
    // @ts-ignore market_data exists in CoinsContractInfoResponse
    marketTotalSupply: contractInfo?.market_data.total_supply ?? 0,
    twitterHandle: contractInfo?.links?.twitter_screen_name,
    // @ts-ignore market_data exists in CoinsContractInfoResponse
    marketCirculatingSupply: contractInfo?.market_data?.circulating_supply ?? 0,
    marketVolume:
      // @ts-ignore market_data exists in CoinsContractInfoResponse
      contractInfo?.market_data?.total_volume[currency] ?? 0,
    // @ts-ignore market_data exists in CoinsContractInfoResponse
    marketCap: contractInfo?.market_data?.market_cap[currency] ?? 0,
    marketCapRank: contractInfo?.market_cap_rank ?? 0,
    chartData,
    token,
    ranges,
    changeChartDays
  }
}
