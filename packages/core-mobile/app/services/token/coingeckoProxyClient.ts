import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import {
  CoinMarketSchema,
  CoinsContractInfoResponseSchema,
  CoinsSearchResponseSchema,
  ContractMarketChartResponseSchema,
  RawSimplePriceResponseSchema
} from 'services/token/types'
import { boolean, number, string } from 'zod'
import Logger from 'utils/Logger'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Coin prices are disabled.')

const baseUrl = Config.PROXY_URL + '/proxy/coingecko'

export const coingeckoProxyClient = new Zodios(
  baseUrl,
  [
    {
      method: 'post',
      path: '/coins/markets',
      parameters: [
        { name: 'vs_currency', type: 'Query', schema: string() },
        { name: 'ids', type: 'Query', schema: string().optional() },
        { name: 'per_page', type: 'Query', schema: number().optional() },
        { name: 'page', type: 'Query', schema: number().optional() },
        { name: 'sparkline', type: 'Query', schema: boolean().optional() }
      ],
      alias: 'coinsMarket',
      response: CoinMarketSchema.array()
    },
    {
      method: 'post',
      path: '/simple/price',
      parameters: [
        { name: 'ids', type: 'Query', schema: string() },
        { name: 'vs_currencies', type: 'Query', schema: string() },
        {
          name: 'include_market_cap',
          type: 'Query',
          schema: string().optional()
        },
        {
          name: 'include_24hr_vol',
          type: 'Query',
          schema: string().optional()
        },
        {
          name: 'include_24hr_change',
          type: 'Query',
          schema: string().optional()
        },
        {
          name: 'include_last_updated_at',
          type: 'Query',
          schema: string().optional()
        }
      ],
      alias: 'simplePrice',
      response: RawSimplePriceResponseSchema
    },
    {
      method: 'post',
      path: '/coins/:id',
      parameters: [{ name: 'id', type: 'Path', schema: string() }],
      alias: 'marketDataByCoinId',
      response: CoinsContractInfoResponseSchema
    },
    {
      method: 'post',
      path: '/coins/:id/market_chart',
      parameters: [
        { name: 'id', type: 'Path', schema: string() },
        { name: 'vs_currency', type: 'Query', schema: string() },
        { name: 'days', type: 'Query', schema: string() },
        { name: 'interval', type: 'Query', schema: string().optional() },
        { name: 'precision', type: 'Query', schema: string().optional() }
      ],
      alias: 'marketChartByCoinId',
      response: ContractMarketChartResponseSchema
    },
    {
      method: 'post',
      path: '/search',
      parameters: [{ name: 'query', type: 'Query', schema: string() }],
      alias: 'searchCoins',
      response: CoinsSearchResponseSchema
    }
  ],
  {
    axiosConfig: {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  }
)
