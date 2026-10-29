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
  CreateCryptoQuoteBodySchema,
  CreateCryptoQuoteSchema,
  CreateSessionWidgetBodySchema,
  CreateSessionWidgetSchema,
  GetTradeLimitsSchema,
  MeldTransactionSchema,
  SearchCountrySchema,
  SearchCryptoCurrencySchema,
  SearchDefaultsByCountrySchema,
  SearchFiatCurrencySchema,
  SearchPaymentMethodsSchema,
  SearchServiceProviderSchema
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
  MeldNetworkPartnerParam as P,
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

// Infer TypeScript types from Zod schemas
type SearchCountry = z.infer<typeof SearchCountrySchema>
type SearchFiatCurrency = z.infer<typeof SearchFiatCurrencySchema>
type SearchCryptoCurrency = z.infer<typeof SearchCryptoCurrencySchema>
type SearchServiceProvider = z.infer<typeof SearchServiceProviderSchema>
type SearchDefaultsByCountry = z.infer<typeof SearchDefaultsByCountrySchema>
type GetTradeLimits = z.infer<typeof GetTradeLimitsSchema>
type SearchPaymentMethods = z.infer<typeof SearchPaymentMethodsSchema>
type CreateCryptoQuoteBody = z.infer<typeof CreateCryptoQuoteBodySchema>
type CreateCryptoQuote = z.infer<typeof CreateCryptoQuoteSchema>
type CreateSessionWidgetBody = z.infer<typeof CreateSessionWidgetBodySchema>
type CreateSessionWidget = z.infer<typeof CreateSessionWidgetSchema>
type MeldTransaction = z.infer<typeof MeldTransactionSchema>

// Query parameters type
interface MeldQueryParams extends Record<string, unknown> {
  serviceProviders?: string
  categories?: string
  accountFilter?: boolean
  countries?: string
  fiatCurrencies?: string
  cryptoCurrencies?: string
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const meldApiClient = (sandbox = false) => {
  const apiBaseUrl = sandbox ? sandboxBaseUrl : baseUrl

  return {
    getPartners: async (params: {
      category: ServiceProviderCategories
      status?: ServiceProviderStatus
    }): Promise<SearchServiceProvider[]> => {
      const queryString = buildQueryString({
        [P.STATUS]: params.status ?? ServiceProviderStatus.LIVE,
        [P.CATEGORY]: params.category
      })
      const partners = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.PARTNERS}${queryString}`,
        { method: 'GET' },
        z.array(NpPartnerSchema)
      )
      return expectArray<NpPartner>(partners, 'partners').map(toServiceProvider)
    },

    getCryptoCurrenciesNp: async (params: {
      category: ServiceProviderCategories
      country?: string
      partner?: string
    }): Promise<SearchCryptoCurrency[]> => {
      const queryString = buildQueryString({
        [P.TYPE]: MeldCurrencyType.CRYPTO,
        [P.CATEGORY]: params.category,
        [P.COUNTRY]: params.country,
        [P.PARTNER]: params.partner
      })
      const response = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.CURRENCIES}${queryString}`,
        { method: 'GET' },
        NpCurrenciesResponseSchema
      )
      return expectArray<NpCurrency>(response?.currencies, 'currencies').map(
        toCryptoCurrency
      )
    },

    getFiatCurrenciesNp: async (params: {
      category: ServiceProviderCategories
      country?: string
    }): Promise<SearchFiatCurrency[]> => {
      const queryString = buildQueryString({
        [P.TYPE]: MeldCurrencyType.FIAT,
        [P.CATEGORY]: params.category,
        [P.COUNTRY]: params.country
      })
      const response = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.CURRENCIES}${queryString}`,
        { method: 'GET' },
        NpCurrenciesResponseSchema
      )
      return expectArray<NpCurrency>(response?.currencies, 'currencies').map(
        toFiatCurrency
      )
    },

    getCountriesNp: async (params: {
      category: ServiceProviderCategories
    }): Promise<SearchCountry[]> => {
      const queryString = buildQueryString({ [P.CATEGORY]: params.category })
      const response = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.COUNTRIES}${queryString}`,
        { method: 'GET' },
        NpCountriesResponseSchema
      )
      return expectArray<NpCountry>(response?.countries, 'countries').map(
        toCountry
      )
    },

    getDefaultsByCountryNp: async (params: {
      category: ServiceProviderCategories
      country: string
    }): Promise<SearchDefaultsByCountry[]> => {
      try {
        const defaults = await fetchJson(
          `${apiBaseUrl}/${
            MeldNetworkPartnerPath.DEFAULTS
          }/${encodeURIComponent(params.country)}/${encodeURIComponent(
            params.category
          )}`,
          { method: 'GET' },
          NpDefaultsSchema
        )
        return [toDefaultsByCountry(defaults)]
      } catch (error) {
        if ((error as HttpError).response?.status === 404) {
          Logger.warn(
            `Meld network-partner defaults 404 for ${params.country}/${params.category}`
          )
          return []
        }
        throw error
      }
    },

    getPaymentMethodsNp: async (params: {
      category: ServiceProviderCategories
      country: string
      currencyCode: string
    }): Promise<SearchPaymentMethods[]> => {
      const queryString = buildQueryString({
        [P.CATEGORY]: params.category,
        [P.COUNTRY]: params.country,
        [P.CURRENCY_CODE]: params.currencyCode
      })
      const methods = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.PAYMENT_METHODS}${queryString}`,
        { method: 'GET' },
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
    }): Promise<NpRoute[]> => {
      const { category, country, sourceCurrencyCode, subdivision } = params
      const path = [
        category,
        country,
        sourceCurrencyCode,
        params.destinationCurrencyCode
      ]
        .map(encodeURIComponent)
        .join('/')
      const queryString = buildQueryString({ [P.SUBDIVISION]: subdivision })
      const routes = await fetchJson(
        `${apiBaseUrl}/${MeldNetworkPartnerPath.ROUTES}/${path}${queryString}`,
        { method: 'GET' },
        z.array(NpRouteSchema)
      )
      return expectArray<NpRoute>(routes, 'routes')
    },

    // GET /service-providers/properties/countries
    getCountries: async (
      params: MeldQueryParams = {}
    ): Promise<SearchCountry[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/properties/countries${queryString}`,
        { method: 'GET' },
        z.array(SearchCountrySchema)
      )
    },

    // GET /service-providers/properties/fiat-currencies
    getFiatCurrencies: async (
      params: MeldQueryParams = {}
    ): Promise<SearchFiatCurrency[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/properties/fiat-currencies${queryString}`,
        { method: 'GET' },
        z.array(SearchFiatCurrencySchema)
      )
    },

    // GET /service-providers/properties/crypto-currencies
    getCryptoCurrencies: async (
      params: MeldQueryParams = {}
    ): Promise<SearchCryptoCurrency[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/properties/crypto-currencies${queryString}`,
        { method: 'GET' },
        z.array(SearchCryptoCurrencySchema)
      )
    },

    // GET /service-providers
    getServiceProviders: async (
      params: MeldQueryParams = {}
    ): Promise<SearchServiceProvider[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers${queryString}`,
        { method: 'GET' },
        z.array(SearchServiceProviderSchema)
      )
    },

    // GET /service-providers/properties/defaults/by-country
    getDefaultsByCountry: async (
      params: MeldQueryParams = {}
    ): Promise<SearchDefaultsByCountry[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/properties/defaults/by-country${queryString}`,
        { method: 'GET' },
        z.array(SearchDefaultsByCountrySchema)
      )
    },

    // GET /service-providers/limits/fiat-currency-purchases
    getPurchaseLimits: async (
      params: MeldQueryParams = {}
    ): Promise<GetTradeLimits[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/limits/fiat-currency-purchases${queryString}`,
        { method: 'GET' },
        z.array(GetTradeLimitsSchema)
      )
    },

    // GET /service-providers/limits/crypto-currency-sells
    getSellLimits: async (
      params: MeldQueryParams = {}
    ): Promise<GetTradeLimits[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/limits/crypto-currency-sells${queryString}`,
        { method: 'GET' },
        z.array(GetTradeLimitsSchema)
      )
    },

    // GET /service-providers/properties/payment-methods
    getPaymentMethods: async (
      params: MeldQueryParams = {}
    ): Promise<SearchPaymentMethods[]> => {
      const queryString = buildQueryString(params)
      return fetchJson(
        `${apiBaseUrl}/service-providers/properties/payment-methods${queryString}`,
        { method: 'GET' },
        z.array(SearchPaymentMethodsSchema)
      )
    },

    // POST /payments/crypto/quote
    createCryptoQuotes: async (
      body: CreateCryptoQuoteBody
    ): Promise<CreateCryptoQuote> => {
      return fetchJson(
        `${apiBaseUrl}/payments/crypto/quote`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        CreateCryptoQuoteSchema
      )
    },

    // POST /crypto/session/widget
    createSessionWidget: async (
      body: CreateSessionWidgetBody
    ): Promise<CreateSessionWidget> => {
      return fetchJson(
        `${apiBaseUrl}/crypto/session/widget`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        },
        CreateSessionWidgetSchema
      )
    },

    // GET /payments/transactions/sessions/:id
    fetchTransactionBySessionId: async (
      id: string
    ): Promise<MeldTransaction> => {
      return fetchJson(
        `${apiBaseUrl}/payments/transactions/sessions/${id}`,
        { method: 'GET' },
        MeldTransactionSchema
      )
    }
  }
}
