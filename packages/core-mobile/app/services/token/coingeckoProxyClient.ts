import Config from 'react-native-config'
import { z } from 'zod'
import {
  CoinMarket,
  CoinMarketSchema,
  CoinsContractInfoResponse,
  CoinsContractInfoResponseSchema,
  CoinsSearchResponse,
  CoinsSearchResponseSchema,
  ContractMarketChartResponse,
  ContractMarketChartResponseSchema,
  RawSimplePriceResponse,
  RawSimplePriceResponseSchema
} from 'services/token/types'
import Logger from 'utils/Logger'
import {
  fetchJson,
  buildQueryString
} from 'utils/api/common/fetchWithValidation'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Coin prices are disabled.')

const baseUrl = Config.PROXY_URL + '/proxy/coingecko'

export const coingeckoProxyClient = {
  // POST /coins/markets
  coinsMarket: async ({
    vs_currency,
    ids,
    per_page,
    page,
    sparkline
  }: {
    vs_currency: string
    ids?: string
    per_page?: number
    page?: number
    sparkline?: boolean
  }): Promise<CoinMarket[]> => {
    const queryString = buildQueryString({
      vs_currency,
      ids,
      per_page,
      page,
      sparkline
    })
    return fetchJson(
      `${baseUrl}/coins/markets${queryString}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      z.array(CoinMarketSchema)
    )
  },

  // POST /simple/price
  simplePrice: async ({
    ids,
    vs_currencies,
    include_market_cap,
    include_24hr_vol,
    include_24hr_change,
    include_last_updated_at
  }: {
    ids: string
    vs_currencies: string
    include_market_cap?: string
    include_24hr_vol?: string
    include_24hr_change?: string
    include_last_updated_at?: string
  }): Promise<RawSimplePriceResponse> => {
    const queryString = buildQueryString({
      ids,
      vs_currencies,
      include_market_cap,
      include_24hr_vol,
      include_24hr_change,
      include_last_updated_at
    })
    return fetchJson(
      `${baseUrl}/simple/price${queryString}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      RawSimplePriceResponseSchema
    )
  },

  // POST /coins/:id
  marketDataByCoinId: async (
    id: string
  ): Promise<CoinsContractInfoResponse> => {
    return fetchJson(
      `${baseUrl}/coins/${id}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      CoinsContractInfoResponseSchema
    )
  },

  // POST /coins/:id/market_chart
  marketChartByCoinId: async ({
    id,
    vs_currency,
    days,
    interval,
    precision
  }: {
    id: string
    vs_currency: string
    days: string
    interval?: string
    precision?: string
  }): Promise<ContractMarketChartResponse> => {
    const queryString = buildQueryString({
      vs_currency,
      days,
      interval,
      precision
    })
    return fetchJson(
      `${baseUrl}/coins/${id}/market_chart${queryString}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      ContractMarketChartResponseSchema
    )
  },

  // POST /search
  searchCoins: async (query: string): Promise<CoinsSearchResponse> => {
    const queryString = buildQueryString({ query })
    return fetchJson(
      `${baseUrl}/search${queryString}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      CoinsSearchResponseSchema
    )
  }
}
