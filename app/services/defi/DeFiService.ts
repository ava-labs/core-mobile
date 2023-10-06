import { defiApiClient, exchangeRateApiClient } from './apiClient'
import {
  DeFiChainObject,
  DeFiProtocolObject,
  DeFiSimpleProtocolObject
} from './debankTypes'

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
