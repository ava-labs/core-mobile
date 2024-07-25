import {
  GetBalancesParams,
  GetBalancesResponse,
  GetTransactionHistory,
  Manifest,
  Module,
  Network,
  NetworkContractToken,
  NetworkFees,
  RpcRequest,
  RpcResponse,
  TransactionHistoryResponse,
  parseManifest
} from '@avalabs/vm-module-types'
import {
  JsonRpcError,
  OptionalDataWithOptionalCause
} from '@metamask/rpc-errors'
import manifest from './bitcoin.manifest.json'

export class BitcoinModule implements Module {
  getManifest(): Manifest | undefined {
    const result = parseManifest(manifest)
    return result.success ? result.data : undefined
  }
  getBalances(_: GetBalancesParams): Promise<GetBalancesResponse> {
    return Promise.resolve({})
  }
  getTransactionHistory(
    _: GetTransactionHistory
  ): Promise<TransactionHistoryResponse> {
    return Promise.resolve({ transactions: [], nextPageToken: '' })
  }
  getNetworkFee(_: Network): Promise<NetworkFees> {
    return Promise.resolve({
      low: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      medium: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      high: { maxPriorityFeePerGas: 0n, maxFeePerGas: 0n },
      baseFee: 0n,
      isFixedFee: false
    })
  }
  getAddress(): Promise<string> {
    return Promise.resolve('Bitcoin address')
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
