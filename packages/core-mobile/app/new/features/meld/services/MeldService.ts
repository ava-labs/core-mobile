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
  async searchCountries({
    sandbox,
    accountFilter,
    categories,
    serviceProviders,
    countries
  }: MeldDefaultParams): Promise<Country[]> {
    return meldApiClient(sandbox).getCountries({
      queries: {
        serviceProviders: serviceProviders?.join(','),
        categories: categories.join(','),
        accountFilter,
        countries: countries?.join(',')
      }
    })
  }

  async searchFiatCurrencies({
    sandbox,
    categories,
    accountFilter,
    serviceProviders,
    fiatCurrencies,
    countries
  }: SearchFiatCurrenciesParams): Promise<FiatCurrency[]> {
    return meldApiClient(sandbox).getFiatCurrencies({
      queries: {
        serviceProviders: serviceProviders?.join(','),
        categories: categories.join(','),
        accountFilter,
        countries: countries?.join(','),
        fiatCurrencies: fiatCurrencies?.join(',')
      }
    })
  }

  async searchCryptoCurrencies({
    sandbox,
    categories,
    countries,
    serviceProviders,
    cryptoCurrencies,
    accountFilter = true
  }: SearchCryptoCurrenciesParams): Promise<CryptoCurrency[]> {
    const queries = {
      serviceProviders: serviceProviders?.join(','),
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    }
    return meldApiClient(sandbox).getCryptoCurrencies({
      queries
    })
  }

  async searchServiceProviders({
    sandbox,
    categories,
    countries,
    accountFilter = true,
    cryptoCurrencies
  }: SearchServiceProvidersParams): Promise<ServiceProvider[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    }
    return meldApiClient(sandbox).getServiceProviders({
      queries
    })
  }

  async searchDefaultsByCountry({
    sandbox,
    categories,
    countries,
    accountFilter = true
  }: SearchDefaultsByCountryParams): Promise<SearchDefaultsByCountry[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(',')
    }
    return meldApiClient(sandbox).getDefaultsByCountry({ queries })
  }

  async getPurchaseLimits({
    sandbox,
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes,
    includeDetails = false
  }: GetTradeLimitsParams): Promise<GetTradeLimits[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    }
    return meldApiClient(sandbox).getPurchaseLimits({ queries })
  }

  async getSellLimits({
    sandbox,
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes,
    includeDetails = false
  }: GetTradeLimitsParams): Promise<GetTradeLimits[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    }
    return meldApiClient(sandbox).getSellLimits({ queries })
  }

  async searchPaymentMethods({
    sandbox,
    categories,
    countries,
    accountFilter = true,
    serviceProviders,
    fiatCurrencies,
    cryptoCurrencyCodes
  }: SearchPaymentMethodsParams): Promise<SearchPaymentMethods[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries?.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(',')
    }
    return meldApiClient(sandbox).getPaymentMethods({ queries })
  }

  async createCryptoQuote({
    sandbox,
    serviceProviders,
    sourceAmount,
    walletAddress,
    countryCode,
    sourceCurrencyCode,
    destinationCurrencyCode,
    paymentMethodType,
    subdivision
  }: CreateCryptoQuoteParams & {
    sandbox?: boolean
  }): Promise<CreateCryptoQuote | undefined> {
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
    return meldApiClient(sandbox).createCryptoQuotes(body)
  }

  async createSessionWidget({
    sandbox,
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
  }: CreateSessionWidgetParams & {
    sandbox?: boolean
  }): Promise<CreateSessionWidget | undefined> {
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
    return meldApiClient(sandbox).createSessionWidget(body)
  }

  // Fetch transaction by session id
  // - sessionId is created in the createSessionWidget function, and the transaction has not been created yet
  // - user has to completed the kyc or signed into the service provider platform
  // - Meld has webhook setup to get the transaction details from the service provider
  // - this endpoint is used to ask Meld to fetch the transaction details from the service provider immediately
  async fetchTrasactionBySessionId({
    sessionId,
    sandbox
  }: {
    sessionId: string
    sandbox?: boolean
  }): Promise<MeldTransaction | undefined> {
    return await meldApiClient(sandbox).fetchTransactionBySessionId({
      params: { id: sessionId }
    })
  }
}

export default new MeldService()
