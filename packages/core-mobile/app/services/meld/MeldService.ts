import { Country } from 'features/buyOnramp/hooks/useSearchCountries'
import {
  CryptoCurrency,
  SearchCryptoCurrenciesParams
} from 'features/buyOnramp/hooks/useSearchCryptoCurrencies'
import { FiatCurrency } from 'features/buyOnramp/hooks/useSearchFiatCurrencies'
import { ServiceProviders } from 'features/buyOnramp/hooks/useSearchServiceProviders'
import Config from 'react-native-config'
import Logger from 'utils/Logger'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Meld service disabled.')

const baseURL = Config.PROXY_URL + '/proxy/meld'

class MeldService {
  async searchCountries(): Promise<Country[]> {
    try {
      const url = new URL(baseURL + '/service-providers/properties/countries')
      const response = await fetch(url, {
        method: 'GET'
      })
      return response.json()
    } catch (error) {
      return []
    }
  }

  async searchFiatCurrencies(): Promise<FiatCurrency[]> {
    try {
      const url = new URL(
        baseURL + '/service-providers/properties/fiat-currencies'
      )
      const response = await fetch(url.toString(), {
        method: 'GET'
      })
      return response.json()
    } catch (error) {
      return []
    }
  }

  async searchCryptoCurrencies({
    categories,
    countries,
    serviceProviders,
    accountFilter = true
  }: SearchCryptoCurrenciesParams): Promise<CryptoCurrency[]> {
    try {
      const commaSeparatedCountries = countries.join(',')
      const commaSeparatedCategories = categories.join(',')
      const commaSeparatedServiceProviders = serviceProviders
        ? serviceProviders.join(',')
        : undefined
      const url = new URL(
        baseURL + '/service-providers/properties/crypto-currencies'
      )
      url.searchParams.set('categories', commaSeparatedCategories)
      url.searchParams.set('countries', commaSeparatedCountries)
      commaSeparatedServiceProviders &&
        url.searchParams.set('serviceProviders', commaSeparatedServiceProviders)
      url.searchParams.set('accountFilter', accountFilter.toString())
      const response = await fetch(url.toString(), {
        method: 'GET'
      })
      return response.json()
    } catch (error) {
      return []
    }
  }

  async searchServiceProviders({
    categories,
    countries,
    serviceProviders,
    accountFilter = true
  }: SearchCryptoCurrenciesParams): Promise<ServiceProviders[]> {
    try {
      const url = new URL(baseURL + '/service-providers')
      const commaSeparatedCategories = categories.join(',')
      const commaSeparatedCountries = countries.join(',')
      const commaSeparatedServiceProviders = serviceProviders
        ? serviceProviders?.join(',')
        : undefined
      url.searchParams.set('categories', commaSeparatedCategories)
      url.searchParams.set('countries', commaSeparatedCountries)
      commaSeparatedServiceProviders &&
        url.searchParams.set('serviceProviders', commaSeparatedServiceProviders)
      url.searchParams.set('accountFilter', accountFilter.toString())
      const response = await fetch(url.toString(), {
        method: 'GET'
      })
      return response.json()
    } catch (error) {
      return []
    }
  }
}

export default new MeldService()
