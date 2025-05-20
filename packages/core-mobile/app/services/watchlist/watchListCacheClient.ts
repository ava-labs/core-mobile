import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { array, string } from 'zod'
import Logger from 'utils/Logger'
import {
  SimplePriceResponseSchema,
  TopTokenSchema,
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
    // tokens endpoint is top 250 + additional markets
    {
      method: 'get',
      path: '/tokens',
      parameters: [{ name: 'currency', type: 'Query', schema: string() }],
      alias: 'tokens',
      response: array(TopTokenSchema)
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
