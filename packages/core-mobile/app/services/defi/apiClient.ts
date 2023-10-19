import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { z } from 'zod'
import {
  DeFiChainSchema,
  DeFiProtocolInformationSchema,
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
    },
    {
      method: 'get',
      path: '/protocol/list',
      parameters: [{ name: 'chain_id', type: 'Query', schema: z.string() }],
      alias: 'getDeFiProtocolInformationList',
      response: z.array(DeFiProtocolInformationSchema)
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

// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.min.json'

export const exchangeRateApiClient = new Zodios(CURRENCY_EXCHANGE_RATES_URL, [
  {
    method: 'get',
    path: '',
    alias: 'getExchangeRates',
    response: ExchangeRateSchema
  }
])
