import {
  COINGECKO_PRO_URL,
  coinsContractInfo,
  CoinsContractInfoResponse,
  coinsContractMarketChart,
  simpleTokenPrice,
  SimpleTokenPriceResponse,
  VsCurrencyType
} from '@avalabs/coingecko-sdk'
import { useRef } from 'react'
import {
  ERC20WithBalance,
  useWalletStateContext
} from '@avalabs/wallet-react-components'
import { CG_AVAX_TOKEN_ID } from 'screens/watchlist/WatchlistView'
import { HttpClient } from '@avalabs/utils-sdk'
import { catchAndLog } from 'utils/Utils'
import Config from 'react-native-config'

export function useCoingeckoRepo() {
  const chartCacheRef = useRef({} as ChartCollection)
  const contractInfoCacheRef = useRef({} as InfoCollection)
  const tokensPriceCacheRef = useRef({} as PricesCollection)
  const { erc20Tokens } = useWalletStateContext()!

  async function getTokensPrice(fresh = false) {
    let tokensPrice = tokensPriceCacheRef.current
    const tokenAddresses = [
      CG_AVAX_TOKEN_ID,
      ...(erc20Tokens?.map((t: ERC20WithBalance) => t.address) ?? [])
    ]

    if (fresh || !tokensPrice || isDataStale(tokensPrice)) {
      await catchAndLog(async () => {
        const freshData = await fetchTokensPrice(tokenAddresses)
        if (freshData) {
          tokensPriceCacheRef.current = freshData
        }
        tokensPrice = freshData
      })
    } else {
      console.log('getTokensPrice cache hit')
    }
    return tokensPrice
  }

  async function getCharData(address: string, days: number, fresh = false) {
    const chartsForAddress = getCachedChartForAddressOrInit(address)
    let chartData = chartsForAddress[days]
    if (fresh || !chartData || isDataStale(chartData)) {
      await catchAndLog(async () => {
        const freshData = await fetchChartData(address, days)
        if (freshData) {
          chartsForAddress[days] = freshData
        }
        chartData = freshData
      })
    } else {
      console.log('getCharData cache hit')
    }
    return chartData
  }

  async function getContractInfo(address: string, fresh = false) {
    let contractInfo = contractInfoCacheRef.current[address]
    if (fresh || !contractInfo || isDataStale(contractInfo)) {
      await catchAndLog(async () => {
        const freshData = await fetchContractInfo(address)
        if (freshData) {
          contractInfoCacheRef.current[address] = freshData
        }
        contractInfo = freshData
      })
    } else {
      console.log('getContractInfo cache hit')
    }
    return contractInfo
  }

  function isDataStale(data: Timestamped) {
    const oneMinute = 1 * 60 * 1000
    // const tenMinutes = 10 * 60 * 1000;
    return !data.timestamp || data.timestamp < new Date().getTime() - oneMinute
  }

  function getCachedChartForAddressOrInit(address: string) {
    let addressChart = chartCacheRef.current[address]
    if (!addressChart) {
      addressChart = {}
      chartCacheRef.current[address] = addressChart
    }
    return addressChart
  }

  async function fetchChartData(address: string, days: number) {
    try {
      const rawData = await coinsContractMarketChart(
        new HttpClient(COINGECKO_PRO_URL),
        {
          assetPlatformId: 'avalanche',
          address: address,
          currency: 'usd' as VsCurrencyType,
          days: days,
          coinGeckoProApiKey: Config.COINGECKO_API_KEY
        }
      )

      const dates = rawData.prices.map(value => value[0])
      const prices = rawData.prices.map(value => value[1])

      const minDate = Math.min(...dates)
      const maxDate = Math.max(...dates)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      const diffValue = prices[prices.length - 1] - prices[0]
      const average = (prices[prices.length - 1] + prices[0]) / 2
      const percentChange = (diffValue / average) * 100

      return {
        ranges: {
          minDate,
          maxDate,
          minPrice,
          maxPrice,
          diffValue,
          percentChange
        },
        dataPoints: rawData.prices.map(tu => {
          return { x: tu[0], y: tu[1] }
        }),
        timestamp: new Date().getTime()
      } as ChartData & Timestamped
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  async function fetchContractInfo(address: string) {
    try {
      const raw = await coinsContractInfo(new HttpClient(COINGECKO_PRO_URL), {
        address: address,
        assetPlatformId: 'avalanche',
        coinGeckoProApiKey: Config.COINGECKO_API_KEY
      })
      return {
        ...raw,
        timestamp: new Date().getTime()
      } as CoinsContractInfoResponse & Timestamped
    } catch (e) {
      return Promise.resolve(undefined)
    }
  }

  async function fetchTokensPrice(tokenAddresses: string[]) {
    const raw = (await simpleTokenPrice(new HttpClient(COINGECKO_PRO_URL), {
      assetPlatformId: 'avalanche',
      coinGeckoProApiKey: Config.COINGECKO_API_KEY,
      tokenAddresses,
      currencies: ['usd'] as VsCurrencyType[],
      marketCap: true,
      vol24: true,
      change24: true
    })) as PricesCollection
    return {
      ...raw,
      timestamp: new Date().getTime()
    } as SimpleTokenPriceResponse & Timestamped
  }

  return {
    getCharData,
    getContractInfo,
    getTokensPrice
  }
}

type Timestamped = {
  timestamp: number
}

export interface ChartData {
  ranges: {
    minDate: number
    maxDate: number
    minPrice: number
    maxPrice: number
    diffValue: number
    percentChange: number
  }
  dataPoints: { x: number; y: number }[]
}

type TokenAddress = string
type ChartDays = number
type ChartCollection = {
  [address: TokenAddress]: {
    [day: ChartDays]: (ChartData & Timestamped) | undefined
  }
}
type InfoCollection = {
  [address: TokenAddress]: (CoinsContractInfoResponse & Timestamped) | undefined
}
type PricesCollection = (SimpleTokenPriceResponse & Timestamped) | undefined
