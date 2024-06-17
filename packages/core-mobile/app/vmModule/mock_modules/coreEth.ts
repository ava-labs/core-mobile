import {
  GetTransactionHistory,
  Manifest,
  Module,
  TransactionHistoryResponse
} from '@internal/types'
import { parseManifest } from './types'
import manifest from './coreEth.manifest.json'

export class CoreEthModule implements Module {
  getManifest(): Manifest | undefined {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  }
  getBalances(): Promise<string> {
    return Promise.resolve('EVM balances')
  }
  getTransactionHistory(
    _: GetTransactionHistory
  ): Promise<TransactionHistoryResponse> {
    return Promise.resolve({ transactions: [], nextPageToken: '' })
  }
  getNetworkFee(): Promise<string> {
    return Promise.resolve('EVM network fee')
  }
  getAddress(): Promise<string> {
    return Promise.resolve('EVM address')
  }
}
