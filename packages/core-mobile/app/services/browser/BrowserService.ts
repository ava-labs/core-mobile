import { browserApiClient } from './apiClient'
import { DeFiProtocolInformationObject } from './debankTypes'

class BrowserService {
  static getDeFiProtocolInformationList = (): Promise<
    DeFiProtocolInformationObject[]
  > => browserApiClient.getDeFiProtocolInformationList('avax')
}

export default BrowserService
