import { Country } from 'features/buyOnramp/hooks/useSearchCountries'
import {
  CryptoCurrency,
  SearchCryptoCurrenciesParams
} from 'features/buyOnramp/hooks/useSearchCryptoCurrencies'
import { FiatCurrency } from 'features/buyOnramp/hooks/useSearchFiatCurrencies'

const baseUrl = 'https://api.meld.io'

class MeldService {
  async searchCountries(): Promise<Country[]> {
    try {
      const url = new URL(baseUrl + '/service-providers/properties/countries')
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization:
            'BASIC WePx8jrDcWKDLNnTQjiW1z:Z6fgRiT6ERbWhBoXc5fNh67ApqXoZpixdnDYg',
          'Content-Type': 'application/json'
        }
      })
      return response.json()
    } catch (error) {
      return []
    }
  }

  async searchFiatCurrencies(): Promise<FiatCurrency[]> {
    try {
      const url = new URL(
        baseUrl + '/service-providers/properties/fiat-currencies'
      )
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization:
            'BASIC WePx8jrDcWKDLNnTQjiW1z:Z6fgRiT6ERbWhBoXc5fNh67ApqXoZpixdnDYg',
          'Content-Type': 'application/json'
        }
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
      const commaSeparatedServiceProviders = serviceProviders.join(',')
      const url = new URL(
        baseUrl + '/service-providers/properties/crypto-currencies'
      )
      url.searchParams.set('categories', commaSeparatedCategories)
      url.searchParams.set('countries', commaSeparatedCountries)
      url.searchParams.set('serviceProviders', commaSeparatedServiceProviders)
      url.searchParams.set('accountFilter', accountFilter.toString())
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization:
            'BASIC WePx8jrDcWKDLNnTQjiW1z:Z6fgRiT6ERbWhBoXc5fNh67ApqXoZpixdnDYg',
          'Content-Type': 'application/json'
        }
      })
      return response.json()
    } catch (error) {
      return []
    }
  }
}

export default new MeldService()
