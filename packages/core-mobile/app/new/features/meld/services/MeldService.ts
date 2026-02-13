import {
  Country,
  CreateCryptoQuote,
  CreateCryptoQuoteParams,
  CreateSessionWidget,
  CreateSessionWidgetParams,
  CryptoCurrency,
  FiatCurrency,
  GetTradeLimits,
  MeldDefaultParams,
  MeldTransaction,
  SearchDefaultsByCountry,
  SearchPaymentMethods,
  ServiceProvider
} from '../types'
import { SearchServiceProvidersParams } from '../hooks/useSearchServiceProviders'
import { SearchFiatCurrenciesParams } from '../hooks/useSearchFiatCurrencies'
import { SearchCryptoCurrenciesParams } from '../hooks/useSearchCryptoCurrencies'
import { SearchDefaultsByCountryParams } from '../hooks/useSearchDefaultsByCountry'
import { SearchPaymentMethodsParams } from '../hooks/useSearchPaymentMethods'
import { GetTradeLimitsParams } from '../hooks/useGetTradeLimits'
import { meldApiClient } from './apiClient'

class MeldService {
  #meldApiClient: ReturnType<typeof meldApiClient>

  init(sandbox?: boolean): void {
    this.#meldApiClient = meldApiClient(sandbox)
  }

  async searchCountries({
    accountFilter,
    categories,
    serviceProviders,
    countries
  }: MeldDefaultParams): Promise<Country[]> {
    return this.#meldApiClient.getCountries({
      serviceProviders: serviceProviders?.join(','),
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(',')
    })
  }

  async searchFiatCurrencies({
    categories,
    accountFilter,
    serviceProviders,
    fiatCurrencies,
    countries
  }: SearchFiatCurrenciesParams): Promise<FiatCurrency[]> {
    return this.#meldApiClient.getFiatCurrencies({
      serviceProviders: serviceProviders?.join(','),
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      fiatCurrencies: fiatCurrencies?.join(',')
    })
  }

  async searchCryptoCurrencies({
    categories,
    countries,
    serviceProviders,
    cryptoCurrencies,
    accountFilter = true
  }: SearchCryptoCurrenciesParams): Promise<CryptoCurrency[]> {
    return this.#meldApiClient.getCryptoCurrencies({
      serviceProviders: serviceProviders?.join(','),
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    })
  }

  async searchServiceProviders({
    categories,
    countries,
    accountFilter = true,
    cryptoCurrencies
  }: SearchServiceProvidersParams): Promise<ServiceProvider[]> {
    return this.#meldApiClient.getServiceProviders({
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    })
  }

  async searchDefaultsByCountry({
    categories,
    countries,
    accountFilter = true
  }: SearchDefaultsByCountryParams): Promise<SearchDefaultsByCountry[]> {
    return this.#meldApiClient.getDefaultsByCountry({
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(',')
    })
  }

  async getPurchaseLimits({
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes,
    includeDetails = false
  }: GetTradeLimitsParams): Promise<GetTradeLimits[]> {
    return this.#meldApiClient.getPurchaseLimits({
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    })
  }

  async getSellLimits({
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes,
    includeDetails = false
  }: GetTradeLimitsParams): Promise<GetTradeLimits[]> {
    return this.#meldApiClient.getSellLimits({
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    })
  }

  async searchPaymentMethods({
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes
  }: SearchPaymentMethodsParams): Promise<SearchPaymentMethods[]> {
    return this.#meldApiClient.getPaymentMethods({
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(',')
    })
  }

  async createCryptoQuote({
    serviceProviders,
    sourceAmount,
    walletAddress,
    countryCode,
    sourceCurrencyCode,
    destinationCurrencyCode,
    paymentMethodType,
    subdivision
  }: CreateCryptoQuoteParams): Promise<CreateCryptoQuote | undefined> {
    const body = {
      serviceProviders,
      countryCode,
      sourceCurrencyCode,
      destinationCurrencyCode,
      sourceAmount,
      walletAddress,
      subdivision,
      paymentMethodType
    }
    return this.#meldApiClient.createCryptoQuotes(body)
  }

  async createSessionWidget({
    sessionType,
    sessionData: {
      serviceProvider,
      redirectUrl,
      redirectFlow,
      sourceAmount,
      walletAddress,
      countryCode,
      sourceCurrencyCode,
      destinationCurrencyCode,
      paymentMethodType
    }
  }: CreateSessionWidgetParams): Promise<CreateSessionWidget | undefined> {
    const body = {
      sessionType,
      sessionData: {
        serviceProvider,
        redirectUrl,
        redirectFlow,
        countryCode,
        sourceCurrencyCode,
        destinationCurrencyCode,
        paymentMethodType,
        sourceAmount,
        walletAddress
      }
    }
    return this.#meldApiClient.createSessionWidget(body)
  }

  // Fetch transaction by session id
  // - sessionId is created in the createSessionWidget function, and the transaction has not been created yet
  // - user has to completed the kyc or signed into the service provider platform
  // - Meld has webhook setup to get the transaction details from the service provider
  // - this endpoint is used to ask Meld to fetch the transaction details from the service provider immediately
  async fetchTrasactionBySessionId({
    sessionId
  }: {
    sessionId: string
  }): Promise<MeldTransaction | undefined> {
    return await this.#meldApiClient.fetchTransactionBySessionId(sessionId)
  }
}

export default new MeldService()
