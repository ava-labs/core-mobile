import { useEffect, useState } from 'react'
import useInAppBrowser from 'hooks/useInAppBrowser'
import { useApplicationContext } from 'contexts/ApplicationContext'
import {
  CoinsContractInfoResponse,
  CoinsInfoResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { selectTokenById, TokenType } from 'store/balance'
import { useSelector } from 'react-redux'
import TokenService from 'services/balance/TokenService'
import { selectActiveNetwork } from 'store/network'

export function useTokenDetail(tokenId: string) {
  const { repo } = useApplicationContext()
  const [isFavorite, setIsFavorite] = useState(true)
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
  const { watchlistFavorites, saveWatchlistFavorites } =
    repo.watchlistFavoritesRepo
  const token = useSelector(selectTokenById(tokenId))
  const network = useSelector(selectActiveNetwork)
  const assetPlatformId =
    network.pricingProviders?.coingecko.assetPlatformId ?? ''
  const currency = selectedCurrency.toLowerCase() as VsCurrencyType

  // TODO cp-2164 move watchlist favorites logic to redux
  // checks if contract can be found in favorites list
  useEffect(() => {
    setIsFavorite(watchlistFavorites.includes(tokenId))
  }, [])

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
    if (!token) return

    if (isFavorite) {
      const index = watchlistFavorites.indexOf(token.id)
      if (index > -1) {
        saveWatchlistFavorites(watchlistFavorites.filter(id => id !== token.id))
      }
    } else {
      saveWatchlistFavorites([...watchlistFavorites, token.id])
    }

    setIsFavorite(!isFavorite)
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
