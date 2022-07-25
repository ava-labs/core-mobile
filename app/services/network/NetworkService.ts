import { InfuraProvider } from '@ethersproject/providers'
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
import { isEthereumNetwork } from './utils/isEthereumNetwork'

const glacierUrl = __DEV__ ? Config.GLACIER_DEV_URL : Config.GLACIER_PROD_URL

const BLOCKCYPHER_PROXY_URL = `${glacierUrl}/proxy/blockcypher`

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

  getEthereumProvider(isTest?: boolean) {
    return new InfuraProvider(
      isTest ? 'rinkeby' : 'homestead',
      process.env.INFURA_API_KEY
    )
  }

  getBitcoinProvider(isTest?: boolean) {
    return new BlockCypherProvider(!isTest, undefined, BLOCKCYPHER_PROXY_URL)
  }

  async getAvalancheProvider(isTest?: boolean): Promise<JsonRpcBatchInternal> {
    const allNetworks = await this.getNetworks()
    const avaxNetwork = isTest
      ? allNetworks[ChainId.AVALANCHE_TESTNET_ID]
      : allNetworks[ChainId.AVALANCHE_MAINNET_ID]
    return this.getProviderForNetwork(avaxNetwork) as JsonRpcBatchInternal
  }

  getProviderForNetwork(network: Network) {
    if (network.vmName === NetworkVMType.BITCOIN) {
      return this.getBitcoinProvider(network.isTestnet)
    }

    if (isEthereumNetwork(network)) {
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
