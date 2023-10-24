import { inAppBrowserApiClient } from './apiClient'
import { DeFiProtocolInformationObject } from './debankTypes'

class InAppBrowserService {
  static getDeFiProtocolInformationList = (): Promise<
    DeFiProtocolInformationObject[]
  > =>
    inAppBrowserApiClient.getDeFiProtocolInformationList({
      queries: { chain_id: 'avax' }
    })
}

export default InAppBrowserService
