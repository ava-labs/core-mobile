import Config from 'react-native-config'
import { z } from 'zod'
import Logger from 'utils/Logger'
import {
  fetchJson,
  buildQueryString,
  HttpError
} from 'utils/api/common/fetchWithValidation'
import {
  MeldCurrencyType,
  ServiceProviderCategories,
  ServiceProviderStatus
} from '../consts'
import {
  Country,
  CreateCryptoQuoteParams,
  CreateSessionWidgetParams,
  CryptoCurrency,
  FiatCurrency,
  SearchDefaultsByCountry,
  SearchPaymentMethods,
  ServiceProvider
} from '../types'
import {
  CreateCryptoQuoteSchema,
  CreateSessionWidgetSchema,
  MeldTransactionSchema
} from './schemas'
import {
  NpCountriesResponseSchema,
  NpCurrenciesResponseSchema,
  NpDefaultsSchema,
  NpPartnerSchema,
  NpPaymentMethodSchema,
  NpCountry,
  NpCurrency,
  NpPartner,
  NpPaymentMethod,
  NpRoute,
  NpRouteSchema
} from './networkPartnerSchemas'
import {
  toCountry,
  toCryptoCurrency,
  toDefaultsByCountry,
  toFiatCurrency,
  toPaymentMethod,
  toServiceProvider
} from './networkPartnerAdapters'
import {
  MeldNetworkPartnerParam as Param,
  MeldNetworkPartnerPath
} from './networkPartnerPaths'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing. Meld service disabled.')

const baseUrl = Config.PROXY_URL + '/proxy/meld'
const sandboxBaseUrl = Config.PROXY_URL + '/proxy/meld-sandbox'

const expectArray = <T>(value: unknown, label: string): T[] => {
  if (!Array.isArray(value))
    throw new Error(`Meld network-partner ${label}: unexpected response shape`)
  return value as T[]
}

const joinPath = (...segments: string[]): string =>
  segments.map(encodeURIComponent).join('/')

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const meldApiClient = (sandbox = false) => {
  const apiBaseUrl = sandbox ? sandboxBaseUrl : baseUrl

  const get = <T>(path: string, schema: z.ZodType<T>): Promise<T> =>
    fetchJson(`${apiBaseUrl}/${path}`, { method: 'GET' }, schema)

  const post = <T>(
    path: string,
    body: unknown,
    schema: z.ZodType<T>
  ): Promise<T> =>
    fetchJson(
      `${apiBaseUrl}/${path}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      },
      schema
    )

  return {
    getPartners: async (params: {
      category: ServiceProviderCategories
      status?: ServiceProviderStatus
    }): Promise<ServiceProvider[]> => {
      const queryString = buildQueryString({
        [Param.STATUS]: params.status ?? ServiceProviderStatus.LIVE,
        [Param.CATEGORY]: params.category
      })
      const partners = await get(
        `${MeldNetworkPartnerPath.PARTNERS}${queryString}`,
        z.array(NpPartnerSchema)
      )
      return expectArray<NpPartner>(partners, 'partners').map(toServiceProvider)
    },

    getCryptoCurrencies: async (params: {
      category: ServiceProviderCategories
      country?: string
      partner?: string
    }): Promise<CryptoCurrency[]> => {
      const queryString = buildQueryString({
        [Param.TYPE]: MeldCurrencyType.CRYPTO,
        [Param.CATEGORY]: params.category,
        [Param.COUNTRY]: params.country,
        [Param.PARTNER]: params.partner
      })
      const response = await get(
        `${MeldNetworkPartnerPath.CURRENCIES}${queryString}`,
        NpCurrenciesResponseSchema
      )
      return expectArray<NpCurrency>(response?.currencies, 'currencies').map(
        toCryptoCurrency
      )
    },

    getFiatCurrencies: async (params: {
      category: ServiceProviderCategories
      country?: string
    }): Promise<FiatCurrency[]> => {
      const queryString = buildQueryString({
        [Param.TYPE]: MeldCurrencyType.FIAT,
        [Param.CATEGORY]: params.category,
        [Param.COUNTRY]: params.country
      })
      const response = await get(
        `${MeldNetworkPartnerPath.CURRENCIES}${queryString}`,
        NpCurrenciesResponseSchema
      )
      return expectArray<NpCurrency>(response?.currencies, 'currencies').map(
        toFiatCurrency
      )
    },

    getCountries: async (params: {
      category: ServiceProviderCategories
    }): Promise<Country[]> => {
      const queryString = buildQueryString({
        [Param.CATEGORY]: params.category
      })
      const response = await get(
        `${MeldNetworkPartnerPath.COUNTRIES}${queryString}`,
        NpCountriesResponseSchema
      )
      return expectArray<NpCountry>(response?.countries, 'countries').map(
        toCountry
      )
    },

    getDefaultsByCountry: async (params: {
      category: ServiceProviderCategories
      country: string
    }): Promise<SearchDefaultsByCountry[]> => {
      const { category, country } = params
      try {
        const defaults = await get(
          `${MeldNetworkPartnerPath.DEFAULTS}/${joinPath(country, category)}`,
          NpDefaultsSchema
        )
        return [toDefaultsByCountry(defaults)]
      } catch (error) {
        if ((error as HttpError).response?.status === 404) {
          Logger.warn(
            `Meld network-partner defaults 404 for ${country}/${category}`
          )
          return []
        }
        throw error
      }
    },

    getPaymentMethods: async (params: {
      category: ServiceProviderCategories
      country: string
      currencyCode: string
    }): Promise<SearchPaymentMethods[]> => {
      const queryString = buildQueryString({
        [Param.CATEGORY]: params.category,
        [Param.COUNTRY]: params.country,
        [Param.CURRENCY_CODE]: params.currencyCode
      })
      const methods = await get(
        `${MeldNetworkPartnerPath.PAYMENT_METHODS}${queryString}`,
        z.array(NpPaymentMethodSchema)
      )
      return expectArray<NpPaymentMethod>(methods, 'payment methods').map(
        toPaymentMethod
      )
    },

    getRoutes: async (params: {
      category: ServiceProviderCategories
      country: string
      sourceCurrencyCode: string
      destinationCurrencyCode: string
      subdivision?: string
    }) => {
      const {
        category,
        country,
        sourceCurrencyCode,
        destinationCurrencyCode,
        subdivision
      } = params
      const path = joinPath(
        category,
        country,
        sourceCurrencyCode,
        destinationCurrencyCode
      )
      const queryString = buildQueryString({ [Param.SUBDIVISION]: subdivision })
      const routes = await get(
        `${MeldNetworkPartnerPath.ROUTES}/${path}${queryString}`,
        z.array(NpRouteSchema)
      )
      return expectArray<NpRoute>(routes, 'routes')
    },

    // POST /payments/crypto/quote
    createCryptoQuotes: (body: CreateCryptoQuoteParams) =>
      post('payments/crypto/quote', body, CreateCryptoQuoteSchema),

    // POST /crypto/session/widget
    createSessionWidget: (body: CreateSessionWidgetParams) =>
      post('crypto/session/widget', body, CreateSessionWidgetSchema),

    // GET /payments/transactions/sessions/:id
    fetchTransactionBySessionId: (id: string) =>
      get(`payments/transactions/sessions/${id}`, MeldTransactionSchema)
  }
}

export type MeldApiClient = ReturnType<typeof meldApiClient>
