import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { Network, NetworkVM, BITCOIN_NETWORK } from 'store/network'

export class NetworkService {
  getProviderForNetwork(network: Network, numberOfRequestsPerBatch = 40) {
    if (network.vm === NetworkVM.BITCOIN) {
      const isMainnet = network.name === BITCOIN_NETWORK.name
      return new BlockCypherProvider(isMainnet)
    } else if (network.vm === NetworkVM.EVM) {
      return new JsonRpcBatchInternal(
        numberOfRequestsPerBatch,
        network.config.rpcUrl.c,
        network.chainId
      )
    } else {
      throw new Error('unsupported network')
    }
  }
}

export default new NetworkService()
