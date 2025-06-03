import { Country } from 'features/buyOnramp/hooks/useSearchCountries'
import { FiatCurrency } from 'features/buyOnramp/hooks/useSearchFiatCurrencies'

const baseUrl = 'https://api.meld.io'

class MeldService {
  async searchCountries(): Promise<Country[]> {
    try {
      const url = new URL(baseUrl + '/service-providers/properties/countries')
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: 'BASIC <API_KEY>',
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
          Authorization: 'BASIC <API_KEY>',
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
