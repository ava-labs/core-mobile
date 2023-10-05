import { Zodios } from '@zodios/core'
import { apiClient as defiApiClient } from './apiClient'
import { ExchangeRateSchema } from './types'

// We're only loading exchange rates for USD at the moment.
const CURRENCY_EXCHANGE_RATES_URL =
  'https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/usd.min.json'

const exchangeRateApiClient = new Zodios(CURRENCY_EXCHANGE_RATES_URL, [
  {
    method: 'get',
    path: '',
    alias: 'getExchangeRates',
    response: ExchangeRateSchema
  }
])

class DeFiService {
  static getSupportedChainList = defiApiClient.getSupportedChainList
  static getDeFiProtocol = defiApiClient.getDeFiProtocol
  static getDeFiProtocolList = defiApiClient.getDeFiProtocolList
  static getExchangeRates = exchangeRateApiClient.getExchangeRates
}

export default DeFiService
