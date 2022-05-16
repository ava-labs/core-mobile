import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { OnStorageReady } from 'services/types'
import { RootState } from 'store'
import { Network, NetworkVM, BITCOIN_NETWORK } from 'store/network'

export class NetworkService implements OnStorageReady {
  // leaving this empty method for now
  // if it turns out we don't need it, we can remove it later
  onStorageReady(_state: RootState): void {
    // do nothing
  }

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
