import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { array, boolean, string } from 'zod'
import Logger from 'utils/Logger'
import {
  CoinMarketSchema,
  SimplePriceResponseSchema,
  TrendingTokenSchema
} from '../token/types'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Watchlist is disabled.')

const baseUrl = Config.PROXY_URL + '/watchlist'

export const watchListCacheClient = new Zodios(
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
        { name: 'topMarkets', type: 'Query', schema: boolean().optional() },
        { name: 'timestamp', type: 'Query', schema: string().optional() }
      ],
      alias: 'markets',
      response: array(CoinMarketSchema)
    },
    {
      method: 'get',
      path: '/trending',
      alias: 'trending',
      response: array(TrendingTokenSchema)
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
