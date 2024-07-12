import Blockaid from '@blockaid/client'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import {
  JsonRpcRequestData,
  SiteScanResponse,
  TransactionScanResponse
} from './types'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Blockaid service disabled.')

const baseURL = Config.PROXY_URL + '/proxy/blockaid/'

const blockaid = new Blockaid({
  baseURL,
  apiKey: 'DUMMY_API_KEY' // since we're using our own proxy and api key is handled there, we can use a dummy key here
})

class BlockaidService {
  static scanSite = async (url: string): Promise<SiteScanResponse> =>
    blockaid.site.scan({ url })

  static scanJsonRpc = async ({
    chainId,
    accountAddress,
    data,
    domain
  }: {
    chainId: number
    accountAddress: string
    data: JsonRpcRequestData
    domain?: string
  }): Promise<TransactionScanResponse> =>
    blockaid.evm.jsonRpc.scan({
      chain: chainId.toString(),
      options: ['validation', 'simulation'],
      account_address: accountAddress,
      data: data,
      // @ts-ignore
      metadata: domain && domain.length > 0 ? { domain } : { non_dapp: true }
    })
}

export default BlockaidService
