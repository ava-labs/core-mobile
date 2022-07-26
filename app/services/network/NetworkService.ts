import { BlockCypherProvider, JsonRpcBatchInternal } from '@avalabs/wallets-sdk'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  getChainsAndTokens,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import { PollingConfig } from 'store/balance'
import Config from 'react-native-config'
import { addGlacierAPIKeyIfNeeded, GLACIER_URL } from 'utils/glacierUtils'
import { store } from 'store'

const BLOCKCYPHER_PROXY_URL = `${GLACIER_URL}/proxy/blockcypher`

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
      addGlacierAPIKeyIfNeeded(rpcUrl),
      chainId
    )

    provider.pollingInterval = PollingConfig.activeNetwork

    return provider
  }

  getEthereumNetwork(isTest?: boolean): Network {
    const allNetworks = this.getCachedNetworks()
    const network = isTest
      ? allNetworks[ChainId.ETHEREUM_TEST_RINKEBY]
      : allNetworks[ChainId.ETHEREUM_HOMESTEAD]
    if (!network) throw new Error('Ethereum network not found')
    return network
  }

  getEthereumProvider(isTest?: boolean): JsonRpcBatchInternal {
    const network = this.getEthereumNetwork(isTest)
    return this.getProviderForNetwork(network) as JsonRpcBatchInternal
  }

  getBitcoinProvider(isTest?: boolean) {
    return new BlockCypherProvider(
      !isTest,
      Config.GLACIER_API_KEY,
      BLOCKCYPHER_PROXY_URL
    )
  }

  getAvalancheNetwork(isTest?: boolean): Network {
    const allNetworks = this.getCachedNetworks()
    const network = isTest
      ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
      : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    if (!network) throw new Error('Avalanche network not found')
    return network
  }

  getAvalancheProvider(isTest?: boolean): JsonRpcBatchInternal {
    const network = this.getAvalancheNetwork(isTest)
    return this.getProviderForNetwork(network) as JsonRpcBatchInternal
  }

  getProviderForNetwork(
    network: Network
  ): JsonRpcBatchInternal | BlockCypherProvider {
    if (network.vmName === NetworkVMType.BITCOIN) {
      return this.getBitcoinProvider(network.isTestnet)
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

  async getNetworks(): Promise<{ [chainId: number]: Network }> {
    const erc20Networks = await getChainsAndTokens(!__DEV__)

    delete erc20Networks[ChainId.AVALANCHE_LOCAL_ID]

    const networks = {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK
    }

    return networks
  }

  getCachedNetworks(): { [chainId: number]: Network } {
    const state = store.getState()
    return state.network.networks
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
