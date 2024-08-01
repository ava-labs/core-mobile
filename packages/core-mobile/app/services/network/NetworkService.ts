import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { avaxSerial } from '@avalabs/avalanchejs'
import { TransactionResponse } from 'ethers'
import { Networks } from 'store/network/types'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { getBitcoinProvider, getEvmProvider } from './utils/providerUtils'

if (!Config.PROXY_URL)
  Logger.warn('PROXY_URL is missing in env file. Network service is disabled.')

class NetworkService {
  async getNetworks(): Promise<Networks> {
    const erc20Networks = await this.fetchERC20Networks()

    delete erc20Networks[ChainId.AVALANCHE_LOCAL_ID]

    return {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK,
      [-ChainId.AVALANCHE_XP]: this.getAvalancheNetworkP(false),
      [-ChainId.AVALANCHE_TEST_XP]: this.getAvalancheNetworkP(true),
      [ChainId.AVALANCHE_XP]: this.getAvalancheNetworkX(false),
      [ChainId.AVALANCHE_TEST_XP]: this.getAvalancheNetworkX(true)
    }
  }

  getProviderForNetwork(
    network: Network
  ): JsonRpcBatchInternal | BitcoinProvider | Avalanche.JsonRpcProvider {
    if (network.vmName === NetworkVMType.BITCOIN) {
      return getBitcoinProvider(network.isTestnet)
    }

    if (network.vmName === NetworkVMType.EVM) {
      return getEvmProvider(network)
    }

    if (
      network.vmName === NetworkVMType.AVM ||
      network.vmName === NetworkVMType.PVM
    ) {
      return network.isTestnet
        ? Avalanche.JsonRpcProvider.getDefaultFujiProvider()
        : Avalanche.JsonRpcProvider.getDefaultMainnetProvider()
    }

    throw new Error(`Unsupported network type: ${network.vmName}`)
  }

  async sendTransaction({
    signedTx,
    network,
    sentryTrx,
    handleWaitToPost
  }: {
    signedTx: string | avaxSerial.SignedTx
    network: Network
    sentryTrx?: Transaction
    handleWaitToPost?: (txResponse: TransactionResponse) => void
  }): Promise<string> {
    return SentryWrapper.createSpanFor(sentryTrx)
      .setContext('svc.network.send_transaction')
      .executeAsync(async () => {
        if (!network) {
          throw new Error('No active network')
        }

        let txID: string | undefined
        const provider = this.getProviderForNetwork(network)

        if (
          signedTx instanceof avaxSerial.SignedTx &&
          provider instanceof Avalanche.JsonRpcProvider
        ) {
          txID = (await provider.issueTx(signedTx)).txID
        } else if (typeof signedTx === 'string') {
          if (provider instanceof JsonRpcBatchInternal) {
            const tx = await provider.broadcastTransaction(signedTx)
            handleWaitToPost?.(tx)
            txID = tx.hash
          } else if (provider instanceof BitcoinProvider) {
            txID = await provider.issueRawTx(signedTx)
          }
        }

        if (txID === undefined) {
          throw new Error('No provider found')
        }

        return txID
      })
  }

  /**
   * Returns the network object for Avalanche X/P Chain
   * @deprecated - Please use {@link getAvalancheNetworkX} or {@link getAvalancheNetworkP}
   */
  getAvalancheNetworkXP(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? AVALANCHE_XP_TEST_NETWORK : AVALANCHE_XP_NETWORK
  }

  /**
   * Returns the network object for Avalanche P Chain
   */
  getAvalancheNetworkP(isDeveloperMode: boolean): Network {
    const pChain = {
      ...AVALANCHE_XP_NETWORK,
      chainId: -AVALANCHE_XP_NETWORK.chainId,
      isTestnet: false,
      vmName: NetworkVMType.PVM,
      chainName: 'Avalanche (P-Chain)',
      logoUri:
        'https://images.ctfassets.net/gcj8jwzm6086/42aMwoCLblHOklt6Msi6tm/1e64aa637a8cead39b2db96fe3225c18/pchain-square.svg',
      networkToken: {
        ...AVALANCHE_XP_NETWORK.networkToken,
        logoUri:
          'https://glacier-api.avax.network/proxy/chain-assets/cb14a1f/chains/43114/token-logo.png'
      },
      explorerUrl: 'https://subnets.avax.network/p-chain'
    } as Network
    const pChainTest = {
      ...AVALANCHE_XP_TEST_NETWORK,
      chainId: -AVALANCHE_XP_TEST_NETWORK.chainId,
      isTestnet: true,
      vmName: NetworkVMType.PVM,
      chainName: 'Avalanche (P-Chain)',
      logoUri:
        'https://images.ctfassets.net/gcj8jwzm6086/42aMwoCLblHOklt6Msi6tm/1e64aa637a8cead39b2db96fe3225c18/pchain-square.svg',
      networkToken: {
        ...AVALANCHE_XP_TEST_NETWORK.networkToken,
        logoUri:
          'https://glacier-api.avax.network/proxy/chain-assets/cb14a1f/chains/43114/token-logo.png'
      },
      explorerUrl: 'https://subnets-test.avax.network/p-chain'
    } as Network
    return isDeveloperMode ? pChainTest : pChain
  }

  /**
   * Returns the network object for Avalanche X Chain
   */
  getAvalancheNetworkX(isDeveloperMode: boolean): Network {
    const xChain = {
      ...AVALANCHE_XP_NETWORK,
      chainName: 'Avalanche (X-Chain)',
      logoUri:
        'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
      explorerUrl: 'https://subnets.avax.network/x-chain'
    } as Network
    const xChainTest = {
      ...AVALANCHE_XP_TEST_NETWORK,
      chainName: 'Avalanche (X-Chain)',
      logoUri:
        'https://images.ctfassets.net/gcj8jwzm6086/5xiGm7IBR6G44eeVlaWrxi/1b253c4744a3ad21a278091e3119feba/xchain-square.svg',
      explorerUrl: 'https://subnets-test.avax.network/x-chain'
    } as Network
    return isDeveloperMode ? xChainTest : xChain
  }
  /**
   * Returns the provider used by Avalanche X/P/CoreEth chains.
   * Using either X or P Network will result in same provider.
   */
  getAvalancheProviderXP(isDeveloperMode: boolean): Avalanche.JsonRpcProvider {
    const network = this.getAvalancheNetworkX(isDeveloperMode)
    return this.getProviderForNetwork(network) as Avalanche.JsonRpcProvider
  }

  private async fetchERC20Networks(): Promise<Networks> {
    const response = await fetch(`${Config.PROXY_URL}/networks`)
    const networks: Network[] = await response.json()

    return networks.reduce((acc, network) => {
      acc[network.chainId] = network
      return acc
    }, {} as Networks)
  }
}

export default new NetworkService()
