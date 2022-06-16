import { InfuraProvider } from '@ethersproject/providers'
import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  ETHEREUM_NETWORK,
  ETHEREUM_TEST_NETWORK_RINKEBY,
  getChainsAndTokens,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import { PollingConfig } from 'store/balance'

const BLOCKCYPHER_PROXY_URL =
  'https://glacier-api.avax-test.network/proxy/blockcypher'

const ethNetworks = [ChainId.ETHEREUM_HOMESTEAD, ChainId.ETHEREUM_TEST_RINKEBY]

// TODO: add support for ETH NETWORKS
class NetworkService {
  getEvmProvider(
    multiContractAddress: string | undefined,
    rpcUrl: string,
    chainId: number
  ) {
    const provider = new JsonRpcBatchInternal(
      {
        maxCalls: 40,
        multiContractAddress
      },
      rpcUrl,
      chainId
    )

    provider.pollingInterval = PollingConfig.activeNetwork

    return provider
  }

  getEthereumProvider(isTest: boolean) {
    return new InfuraProvider(
      isTest ? 'rinkeby' : 'homestead',
      process.env.INFURA_API_KEY
    )
  }

  getBitcoinProvider(isMainnet: boolean) {
    return new BlockCypherProvider(isMainnet, undefined, BLOCKCYPHER_PROXY_URL)
  }

  getProviderForNetwork(network: Network) {
    if (network.vmName === NetworkVMType.BITCOIN) {
      return this.getBitcoinProvider(!network.isTestnet)
    }

    if (ethNetworks.includes(network.chainId)) {
      return this.getEthereumProvider(network.isTestnet)
    }

    if (network.vmName === NetworkVMType.EVM) {
      const multiContractAddress = network.utilityAddresses?.multicall
      const rpcUrl = network.rpcUrl
      const chainId = network.chainId

      const provider = this.getEvmProvider(
        multiContractAddress,
        rpcUrl,
        chainId
      )

      return provider
    }

    throw new Error('unsupported network')
  }

  async getNetworks() {
    const erc20Networks = await getChainsAndTokens()

    delete erc20Networks[ChainId.AVALANCHE_LOCAL_ID]

    const networks = {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
      [ChainId.ETHEREUM_HOMESTEAD]: ETHEREUM_NETWORK,
      [ChainId.ETHEREUM_TEST_RINKEBY]: ETHEREUM_TEST_NETWORK_RINKEBY
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
