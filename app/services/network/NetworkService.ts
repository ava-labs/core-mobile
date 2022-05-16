import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import { OnStorageReady } from 'services/types'
import { RootState } from 'store'
import {
  Network,
  NetworkVM,
  BITCOIN_NETWORK,
  selectActiveNetwork
} from 'store/network'

export class NetworkService implements OnStorageReady {
  // we might not need to store active network here since the data is already in the redux store
  // leaving it here for now
  private _activeNetwork?: Network

  get activeNetwork(): Network | undefined {
    return this._activeNetwork
  }

  set activeNetwork(network: Network | undefined) {
    this._activeNetwork = network
  }

  onStorageReady(state: RootState): void {
    this.activeNetwork = selectActiveNetwork(state)
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
