import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { array, boolean, string } from 'zod'
import { CoinMarketSchema, SimplePriceResponseSchema } from './types'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/watchlist'

export const tokenServiceApiClient = new Zodios(
  baseUrl,
  [
    {
      method: 'get',
      path: '/price',
      alias: 'simplePrice',
      response: SimplePriceResponseSchema
    },
    {
      method: 'get',
      path: '/markets',
      parameters: [
        { name: 'currency', type: 'Query', schema: string() },
        { name: 'topMarkets', type: 'Query', schema: boolean().optional() }
      ],
      alias: 'markets',
      response: array(CoinMarketSchema)
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
