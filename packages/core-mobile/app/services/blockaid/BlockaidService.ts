import { TransactionParams } from 'store/rpc/handlers/eth_sendTransaction/utils'
import { ChainId } from '@avalabs/chains-sdk'
import { createBlockaidAPIClient } from './apiClient'
import {
  TransactionValidationSimulationCamelCase,
  TransactionValidationResult
} from './types'

class BlockaidService {
  static getNetworkPath = (chainId: number): string => {
    switch (chainId) {
      case ChainId.ETHEREUM_HOMESTEAD:
        return 'ethereum'
      case ChainId.AVALANCHE_MAINNET_ID:
        return 'avalanche'
      default:
        throw new Error(`[Blockaid] Unsupported chainId: ${chainId}`)
    }
  }

  static validateTransaction = async (
    chainId: number,
    params: TransactionParams,
    domain?: string
  ): Promise<TransactionValidationResult> => {
    const network = BlockaidService.getNetworkPath(chainId)

    const data = await createBlockaidAPIClient(network).validateTransaction({
      options: ['validation', 'simulation'],
      metadata: domain && domain.length > 0 ? { domain } : { non_dapp: true },
      data: {
        from: params.from,
        to: params.to,
        data: params.data,
        value: params.value,
        gas: params.gas,
        gas_price: params.gasPrice
      }
    })

    return TransactionValidationSimulationCamelCase.parse(data)
  }
}

export default BlockaidService
