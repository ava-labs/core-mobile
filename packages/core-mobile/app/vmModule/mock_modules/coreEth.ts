import {
  GetTransactionHistory,
  Manifest,
  Module,
  RpcResponse,
  TransactionHistoryResponse,
  RpcRequest,
  NetworkFees,
  parseManifest,
  NetworkContractToken,
  Network
} from '@avalabs/vm-module-types'
import {
  JsonRpcError,
  OptionalDataWithOptionalCause
} from '@metamask/rpc-errors'
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
  getNetworkFee(): Promise<NetworkFees> {
    return Promise.resolve({
      low: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      medium: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      high: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      baseFee: 0n
    })
  }
  getAddress(): Promise<string> {
    return Promise.resolve('EVM address')
  }
  getTokens(_: Network): Promise<NetworkContractToken[]> {
    return Promise.resolve([])
  }
  onRpcRequest(
    request: RpcRequest
  ): Promise<
    RpcResponse<unknown, JsonRpcError<OptionalDataWithOptionalCause>>
  > {
    throw new Error(`Method not implemented: ${request.method}`)
  }
}
