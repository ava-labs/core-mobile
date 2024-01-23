import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { any, boolean, number, string } from 'zod'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

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
      alias: 'coinsMarkets',
      response: any()
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
      response: any()
    },
    {
      method: 'post',
      path: '/coins/:id',
      parameters: [{ name: 'id', type: 'Path', schema: string() }],
      alias: 'marketDataByCoinId',
      response: any()
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
      response: any()
    },
    {
      method: 'post',
      path: '/search',
      parameters: [{ name: 'query', type: 'Query', schema: string() }],
      alias: 'searchCoins',
      response: any()
    },
    {
      method: 'post',
      path: '/simple/token_price/:id',
      parameters: [
        { name: 'id', type: 'Path', schema: string() },
        { name: 'contract_addresses', type: 'Query', schema: string().array() },
        { name: 'vs_currencies', type: 'Query', schema: string().array() },
        {
          name: 'include_market_cap',
          type: 'Query',
          schema: boolean().optional()
        },
        {
          name: 'include_24hr_vol',
          type: 'Query',
          schema: boolean().optional()
        },
        {
          name: 'include_24hr_change',
          type: 'Query',
          schema: boolean().optional()
        }
      ],
      alias: 'simplePriceByContractAddresses',
      response: any()
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
