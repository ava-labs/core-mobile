import { InfuraProvider } from '@ethersproject/providers'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import {
  BITCOIN_NETWORK,
  ChainId,
  ETHEREUM_NETWORK,
  getChainsAndTokens,
  Network
} from '@avalabs/chains-sdk'

const evmNetworks = [ChainId.AVALANCHE_MAINNET_ID, ChainId.AVALANCHE_TESTNET_ID]
const btcNetworks = [ChainId.BITCOIN]
const ethNetworks: number[] = []

// TODO: add support for ETH NETWORKS and BITCOIN TEST NET
class NetworkService {
  getEvmProvider(network: Network, numberOfChunksPerRequestBatch = 40) {
    return new JsonRpcBatchInternal(
      numberOfChunksPerRequestBatch,
      network.rpcUrl,
      network.chainId
    )
  }

  getAvalancheProvider(isTest: boolean, networks: Network[]) {
    const network = isTest
      ? networks[ChainId.AVALANCHE_TESTNET_ID]
      : networks[ChainId.AVALANCHE_MAINNET_ID]

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
      return this.getBitcoinProvider(network.isTestnet)
    } else if (ethNetworks.includes(network.chainId)) {
      return this.getEthereumProvider(network.isTestnet)
    }

    throw new Error('unsupported network')
  }

  async getNetworks() {
    const erc20Networks = await getChainsAndTokens()
    const networks = {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.ETHEREUM_HOMESTEAD]: ETHEREUM_NETWORK
    }

    return networks
  }

  async sendTransaction(signedTx: string, network: Network) {
    if (!network) {
      throw new Error('No active network')
    }
    const provider = this.getProviderForNetwork(network)
    if (provider instanceof JsonRpcBatchInternal) {
      return (await provider.sendTransaction(signedTx)).hash
    }

    if (provider instanceof BlockCypherProvider) {
      return (await provider.issueRawTx(signedTx)).hash
    }

    throw new Error('No provider found')
  }
}

export default new NetworkService()
