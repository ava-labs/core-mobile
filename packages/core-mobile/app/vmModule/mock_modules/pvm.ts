import {
  GetTransactionHistory,
  Manifest,
  Module,
  NetworkFees,
  RpcRequest,
  RpcResponse,
  TransactionHistoryResponse,
  parseManifest
} from '@avalabs/vm-module-types'
import manifest from './pvm.manifest.json'

export class PVMModule implements Module {
  getManifest(): Manifest | undefined {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  }
  getBalances(): Promise<string> {
    return Promise.resolve('PVM balances')
  }
  getTransactionHistory(
    _: GetTransactionHistory
  ): Promise<TransactionHistoryResponse> {
    return Promise.resolve({ transactions: [], nextPageToken: '' })
  }
  getNetworkFee(): Promise<NetworkFees> {
    return Promise.resolve({
      low: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      medium: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      high: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      baseFee: 0n
    })
  }
  getAddress(): Promise<string> {
    return Promise.resolve('PVM address')
  }
  onRpcRequest(request: RpcRequest): Promise<RpcResponse<unknown, Error>> {
    throw new Error(`Method not implemented: ${request.method}`)
  }
}
