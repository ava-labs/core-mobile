import {
  Country,
  CryptoCurrency,
  FiatCurrency,
  MeldDefaultParams,
  ServiceProvider
} from '../types'
import { SearchServiceProvidersParams } from '../hooks/useSearchServiceProviders'
import { SearchFiatCurrenciesParams } from '../hooks/useSearchFiatCurrencies'
import { SearchCryptoCurrenciesParams } from '../hooks/useSearchCryptoCurrencies'
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
}

export default new MeldService()
