import { Zodios } from '@zodios/core'
import Config from 'react-native-config'
import { z } from 'zod'
import Logger from 'utils/Logger'
import {
  SearchCountrySchema,
  SearchCryptoCurrencySchema,
  SearchFiatCurrencySchema,
  SearchServiceProviderSchema
} from './schemas'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. Meld service disabled.')

const baseUrl = Config.PROXY_URL + '/proxy/meld'

export const meldApiClient = new Zodios(
  baseUrl,
  [
    {
      method: 'get',
      path: '/service-providers/properties/countries',
      parameters: [
        {
          name: 'serviceProviders',
          type: 'Query',
          schema: z.string().optional()
        },
        { name: 'categories', type: 'Query', schema: z.string().optional() },
        {
          name: 'accountFilter',
          type: 'Query',
          schema: z.boolean().optional()
        },
        { name: 'countries', type: 'Query', schema: z.string().optional() }
      ],
      alias: 'getCountries',
      response: z.array(SearchCountrySchema)
    },
    {
      method: 'get',
      path: '/service-providers/properties/fiat-currencies',
      parameters: [
        {
          name: 'serviceProviders',
          type: 'Query',
          schema: z.string().optional()
        },
        { name: 'categories', type: 'Query', schema: z.string().optional() },
        {
          name: 'accountFilter',
          type: 'Query',
          schema: z.boolean().optional()
        },
        {
          name: 'fiatCurrencies',
          type: 'Query',
          schema: z.string().optional()
        },
        { name: 'countries', type: 'Query', schema: z.string().optional() }
      ],
      alias: 'getFiatCurrencies',
      response: z.array(SearchFiatCurrencySchema)
    },
    {
      method: 'get',
      path: '/service-providers/properties/crypto-currencies',
      parameters: [
        {
          name: 'serviceProviders',
          type: 'Query',
          schema: z.string().optional()
        },
        { name: 'categories', type: 'Query', schema: z.string().optional() },
        {
          name: 'accountFilter',
          type: 'Query',
          schema: z.boolean().optional()
        },
        { name: 'countries', type: 'Query', schema: z.string().optional() },
        {
          name: 'cryptoCurrencies',
          type: 'Query',
          schema: z.string().optional()
        }
      ],
      alias: 'getCryptoCurrencies',
      response: z.array(SearchCryptoCurrencySchema)
    },
    {
      method: 'get',
      path: '/service-providers',
      parameters: [
        { name: 'categories', type: 'Query', schema: z.string().optional() },
        {
          name: 'accountFilter',
          type: 'Query',
          schema: z.boolean().optional()
        },
        { name: 'countries', type: 'Query', schema: z.string().optional() },
        {
          name: 'cryptoCurrencies',
          type: 'Query',
          schema: z.string().optional()
        }
      ],
      alias: 'getServiceProviders',
      response: z.array(SearchServiceProviderSchema)
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
