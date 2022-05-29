import { InfuraProvider } from '@ethersproject/providers'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import {
  Network,
  BITCOIN_NETWORK,
  MAINNET_NETWORK,
  FUJI_NETWORK
} from 'store/network'

const evmNetworks = [MAINNET_NETWORK.chainId, FUJI_NETWORK.chainId]
const btcNetworks = [BITCOIN_NETWORK.chainId]
const ethNetworks: number[] = []

// TODO: add support for ETH NETWORKS and BITCOIN TEST NET
export class NetworkService {
  getEvmProvider(network: Network, numerOfChunksPerRequestBatch = 40) {
    return new JsonRpcBatchInternal(
      numerOfChunksPerRequestBatch,
      network.config.rpcUrl.c,
      network.chainId
    )
  }

  getAvalancheProvider(isTest: boolean) {
    const network = isTest ? FUJI_NETWORK : MAINNET_NETWORK
    return this.getEvmProvider(network)
  }

  getEthereumProvider(isTest: boolean) {
    return new InfuraProvider(
      isTest ? 'rinkeby' : 'homestead',
      process.env.INFURA_API_KEY
    )
  }

  getBitcoinProvider(_isDeveloperMode: boolean) {
    // TODO support test nets
    return new BlockCypherProvider(true)
  }

  getProviderForNetwork(network: Network) {
    if (evmNetworks.includes(network.chainId)) {
      return this.getEvmProvider(network)
    } else if (btcNetworks.includes(network.chainId)) {
      return this.getBitcoinProvider(network.isTest)
    } else if (ethNetworks.includes(network.chainId)) {
      return this.getEthereumProvider(network.isTest)
    }

    throw new Error('unsupported network')
  }
}

export default new NetworkService()
