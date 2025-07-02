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
    accountFilter,
    categories,
    serviceProviders,
    countries
  }: MeldDefaultParams): Promise<Country[]> {
    return meldApiClient.getCountries({
      queries: {
        serviceProviders: serviceProviders?.join(','),
        categories: categories.join(','),
        accountFilter,
        countries: countries.join(',')
      }
    })
  }

  async searchFiatCurrencies({
    categories,
    accountFilter,
    serviceProviders,
    fiatCurrencies,
    countries
  }: SearchFiatCurrenciesParams): Promise<FiatCurrency[]> {
    return meldApiClient.getFiatCurrencies({
      queries: {
        serviceProviders: serviceProviders?.join(','),
        categories: categories.join(','),
        accountFilter,
        countries: countries.join(','),
        fiatCurrencies: fiatCurrencies?.join(',')
      }
    })
  }

  async searchCryptoCurrencies({
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
      countries: countries.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    }
    return meldApiClient.getCryptoCurrencies({
      queries
    })
  }

  async searchServiceProviders({
    categories,
    countries,
    accountFilter = true,
    cryptoCurrencies
  }: SearchServiceProvidersParams): Promise<ServiceProvider[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries.join(','),
      cryptoCurrencies: cryptoCurrencies?.join(',')
    }
    return meldApiClient.getServiceProviders({
      queries
    })
  }

  async searchDefaultsByCountry({
    categories,
    countries,
    accountFilter = true
  }: SearchDefaultsByCountryParams): Promise<SearchDefaultsByCountry[]> {
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries.join(',')
    }
    return meldApiClient.getDefaultsByCountry({ queries })
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
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    }
    return meldApiClient.getPurchaseLimits({ queries })
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
    const queries = {
      categories: categories.join(','),
      accountFilter,
      countries: countries.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(','),
      includeDetails
    }
    return meldApiClient.getSellLimits({ queries })
  }

  async searchPaymentMethods({
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
      countries: countries.join(','),
      serviceProviders: serviceProviders?.join(','),
      fiatCurrencies: fiatCurrencies?.join(','),
      cryptoCurrencies: cryptoCurrencyCodes?.join(',')
    }
    return meldApiClient.getPaymentMethods({ queries })
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
    return meldApiClient.createCryptoQuotes(body)
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
    return meldApiClient.createSessionWidget(body)
  }
}

export default new MeldService()
