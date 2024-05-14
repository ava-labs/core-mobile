import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { ChainId } from '@avalabs/chains-sdk'
import Blockaid from '@blockaid/client'
import Config from 'react-native-config'
import {
  JsonRpcRequestData,
  SiteScanResponse,
  TransactionScanResponse,
  TransactionScanSupportedChain
} from './types'

if (!Config.PROXY_URL) throw Error('PROXY_URL is missing')

const baseURL = Config.PROXY_URL + '/proxy/blockaid/'

const blockaid = new Blockaid({
  baseURL,
  apiKey: 'DUMMY_API_KEY' // since we're using our own proxy and api key is handled there, we can use a dummy key here
})

class BlockaidService {
  static scanSite = async (url: string): Promise<SiteScanResponse> => {
    return await blockaid.site.scan({ url })
  }

  static scanTransaction = async (
    chainId: number,
    params: TransactionParams,
    domain?: string
  ): Promise<TransactionScanResponse> => {
    return await blockaid.evm.transaction.scan({
      account_address: params.from,
      chain: BlockaidService.getNetworkPath(chainId),
      options: ['validation', 'simulation'],
      data: {
        from: params.from,
        to: params.to,
        data: params.data,
        value: params.value,
        gas: params.gas,
        gas_price: params.gasPrice
      },
      // @ts-ignore
      metadata: domain && domain.length > 0 ? { domain } : { non_dapp: true }
    })
  }

  static scanJSONRPC = async ({
    chainId,
    accountAddress,
    data,
    domain
  }: {
    chainId: number
    accountAddress: string
    data: JsonRpcRequestData
    domain?: string
  }): Promise<TransactionScanResponse> => {
    return await blockaid.evm.jsonRpc.scan({
      chain: BlockaidService.getNetworkPath(chainId),
      options: ['validation', 'simulation'],
      account_address: accountAddress,
      data: data,
      // @ts-ignore
      metadata: domain && domain.length > 0 ? { domain } : { non_dapp: true }
    })
  }

  private static getNetworkPath = (
    chainId: number
  ): TransactionScanSupportedChain => {
    switch (chainId) {
      case ChainId.ETHEREUM_HOMESTEAD:
        return 'ethereum'
      case ChainId.AVALANCHE_MAINNET_ID:
        return 'avalanche'
      default:
        throw new Error(`[Blockaid] Unsupported chainId: ${chainId}`)
    }
  }
}

export default BlockaidService
