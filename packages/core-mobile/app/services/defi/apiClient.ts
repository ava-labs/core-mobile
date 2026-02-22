import Config from 'react-native-config'
import { z } from 'zod'
import Logger from 'utils/Logger'
import {
  fetchJson,
  buildQueryString
} from 'utils/api/common/fetchWithValidation'
import {
  DeFiChainSchema,
  DeFiProtocolSchema,
  DeFiSimpleProtocolSchema
} from './debankTypes'
import { ExchangeRateSchema } from './types'

if (!Config.PROXY_URL) Logger.warn('PROXY_URL is missing. Defi disabled.')

const baseUrl = Config.PROXY_URL + '/proxy/debank/v1'

// Infer TypeScript types from Zod schemas
type DeFiChain = z.infer<typeof DeFiChainSchema>
type DeFiProtocol = z.infer<typeof DeFiProtocolSchema>
type DeFiSimpleProtocol = z.infer<typeof DeFiSimpleProtocolSchema>
type ExchangeRate = z.infer<typeof ExchangeRateSchema>

export const defiApiClient = {
  // GET /chain/list
  getSupportedChainList: async (): Promise<DeFiChain[]> => {
    return fetchJson(
      `${baseUrl}/chain/list`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      z.array(DeFiChainSchema)
    )
  },

  // GET /user/protocol
  getDeFiProtocol: async ({
    id,
    protocol_id
  }: {
    id: string
    protocol_id: string
  }): Promise<DeFiProtocol> => {
    const queryString = buildQueryString({ id, protocol_id })
    return fetchJson(
      `${baseUrl}/user/protocol${queryString}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      DeFiProtocolSchema
    )
  },

  // GET /user/all_simple_protocol_list
  getDeFiProtocolList: async (id: string): Promise<DeFiSimpleProtocol[]> => {
    const queryString = buildQueryString({ id })
    return fetchJson(
      `${baseUrl}/user/all_simple_protocol_list${queryString}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      },
      z.array(DeFiSimpleProtocolSchema)
    )
  }
}

// https://github.com/fawazahmed0/exchange-api/blob/main/README.md#free-currency-exchange-rates-api
// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.min.json'

const CURRENCY_EXCHANGE_RATES_FALLBACK_URL =
  'https://latest.currency-api.pages.dev/v1/currencies/usd.min.json'

export const exchangeRateApiClient = {
  // GET /
  getExchangeRates: async (): Promise<ExchangeRate> => {
    return fetchJson(
      CURRENCY_EXCHANGE_RATES_URL,
      { method: 'GET' },
      ExchangeRateSchema
    )
  }
}

export const exchangeRateFallbackApiClient = {
  // GET /
  getExchangeRates: async (): Promise<ExchangeRate> => {
    return fetchJson(
      CURRENCY_EXCHANGE_RATES_FALLBACK_URL,
      { method: 'GET' },
      ExchangeRateSchema
    )
  }
}
