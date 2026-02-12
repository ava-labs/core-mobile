import {
  defiApiClient,
  exchangeRateApiClient,
  exchangeRateFallbackApiClient
} from './apiClient'
import {
  DeFiChainObject,
  DeFiProtocolObject,
  DeFiSimpleProtocolObject
} from './debankTypes'
import { ExchangeRate } from './types'

class DeFiService {
  static getSupportedChainList = (): Promise<DeFiChainObject[]> =>
    defiApiClient.getSupportedChainList()

  static getDeFiProtocol = (
    userAddress: string,
    protocolId: string
  ): Promise<DeFiProtocolObject> =>
    defiApiClient.getDeFiProtocol({
      id: userAddress,
      protocol_id: protocolId
    })

  static getDeFiProtocolList = (
    userAddress: string
  ): Promise<DeFiSimpleProtocolObject[]> =>
    defiApiClient.getDeFiProtocolList(userAddress)

  static getExchangeRates = async (): Promise<ExchangeRate> => {
    try {
      return await exchangeRateApiClient.getExchangeRates()
    } catch {
      return await exchangeRateFallbackApiClient.getExchangeRates()
    }
  }
}

export default DeFiService
