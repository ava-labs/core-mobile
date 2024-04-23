import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { z } from 'zod'
import {
  DeFiChainSchema,
  DeFiProtocolSchema,
  DeFiSimpleProtocolSchema
} from './debankTypes'
import { ExchangeRateSchema } from './types'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'

export const defiApiClient = new Zodios(
  baseUrl,
  [
    {
      method: 'get',
      path: '/chain/list',
      alias: 'getSupportedChainList',
      response: z.array(DeFiChainSchema)
    },
    {
      method: 'get',
      path: '/user/protocol',
      parameters: [
        { name: 'id', type: 'Query', schema: z.string() },
        { name: 'protocol_id', type: 'Query', schema: z.string() }
      ],
      alias: 'getDeFiProtocol',
      response: DeFiProtocolSchema
    },
    {
      method: 'get',
      path: '/user/all_simple_protocol_list',
      parameters: [{ name: 'id', type: 'Query', schema: z.string() }],
      alias: 'getDeFiProtocolList',
      response: z.array(DeFiSimpleProtocolSchema)
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

// https://github.com/fawazahmed0/exchange-api/blob/main/README.md#free-currency-exchange-rates-api
// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'

const CURRENCY_EXCHANGE_RATES_FALLBACK_URL =
  'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'

const createExchangeRateApiClient = (url: string): Zodios =>
  new Zodios(url, [
    {
      method: 'get',
      path: '',
      alias: 'getExchangeRates',
      response: ExchangeRateSchema
    }
  ])

export const exchangeRateApiClient = createExchangeRateApiClient(
  CURRENCY_EXCHANGE_RATES_URL
)

export const exchangeRateFallbackApiClient = createExchangeRateApiClient(
  CURRENCY_EXCHANGE_RATES_FALLBACK_URL
)
