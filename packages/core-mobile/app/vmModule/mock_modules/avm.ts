import {
  GetTransactionHistory,
  Manifest,
  Module,
  TransactionHistoryResponse
} from '@internal/types'
import { parseManifest } from './types'
import manifest from './avm.manifest.json'

export class AVMModule implements Module {
  getManifest(): Manifest | undefined {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  }
  getBalances(): Promise<string> {
    return Promise.resolve('AVM balances')
  }
  getTransactionHistory(
    _: GetTransactionHistory
  ): Promise<TransactionHistoryResponse> {
    return Promise.resolve({ transactions: [], nextPageToken: '' })
  }
  getNetworkFee(): Promise<string> {
    return Promise.resolve('AVM network fee')
  }
  getAddress(): Promise<string> {
    return Promise.resolve('AVM address')
  }
}
