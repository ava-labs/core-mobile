import axios from 'axios'
import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { array, string, z } from 'zod'
import Logger from 'utils/Logger'
import {
  SimplePriceResponseSchema,
  TopTokenSchema,
  TrendingTokenSchema
} from '../token/types'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Watchlist is disabled.')

const baseUrl = `${Config.PROXY_URL}/watchlist`

// Infer types from schemas for typings
export type SimplePriceResponse = z.infer<typeof SimplePriceResponseSchema>
export type TopToken = z.infer<typeof TopTokenSchema>
export type TrendingToken = z.infer<typeof TrendingTokenSchema>

// Dev (validated) and Prod (raw) clients
const devClient = new Zodios(
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
      headers: { 'Content-Type': 'application/json' }
    }
  }
)

const prodClient = axios.create({
  baseURL: baseUrl,
  headers: { 'Content-Type': 'application/json' }
})

// Force validation on/off
const useValidation = __DEV__ //in normal use

export const watchListCacheClient = {
  /**
   * GET /price
   */
  async simplePrice(): Promise<SimplePriceResponse> {
    if (useValidation) {
      return devClient.simplePrice()
    }
    const { data } = await prodClient.get<SimplePriceResponse>('/price')
    return data
  },

  /**
   * GET /tokens?currency=...
   */
  async tokens(params: { queries: { currency: string } }): Promise<TopToken[]> {
    if (useValidation) {
      // Match Zodios’ expected input shape exactly
      return devClient.tokens(params)
    }
    const { data } = await prodClient.get<TopToken[]>('/tokens', {
      params: params.queries
    })
    return data
  },

  /**
   * GET /trending
   */
  async trending(params?: Record<string, never>): Promise<TrendingToken[]> {
    if (useValidation) {
      return devClient.trending(params)
    }
    const { data } = await prodClient.get<TrendingToken[]>('/trending')
    return data
  }
}
