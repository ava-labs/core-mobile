import { Zodios } from '@zodios/core'
import { apiClient as defiApiClient } from './apiClient'
import { ExchangeRateSchema } from './types'
import {
  DeFiChainObject,
  DeFiProtocolObject,
  DeFiSimpleProtocolObject
} from './debankTypes'

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
  static getSupportedChainList = (): Promise<DeFiChainObject[]> =>
    defiApiClient.getSupportedChainList()

  static getDeFiProtocol = (
    userAddress: string,
    protocolId: string
  ): Promise<DeFiProtocolObject> =>
    defiApiClient.getDeFiProtocol({
      queries: { id: userAddress, protocol_id: protocolId }
    })

  static getDeFiProtocolList = (
    userAddress: string
  ): Promise<DeFiSimpleProtocolObject[]> =>
    defiApiClient.getDeFiProtocolList({ queries: { id: userAddress } })

  static getExchangeRates = exchangeRateApiClient.getExchangeRates
}

export default DeFiService
