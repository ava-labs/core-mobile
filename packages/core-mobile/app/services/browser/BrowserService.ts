import { browserApiClient } from './apiClient'
import { DeFiProtocolInformationObject } from './debankTypes'

class BrowserService {
  static getDeFiProtocolInformationList = (): Promise<
    DeFiProtocolInformationObject[]
  > =>
    browserApiClient.getDeFiProtocolInformationList({
      queries: { chain_id: 'avax' }
    })
}

export default BrowserService
