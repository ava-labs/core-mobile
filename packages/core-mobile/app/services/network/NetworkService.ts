import {
  Avalanche,
  BitcoinProvider,
  JsonRpcBatchInternal
} from '@avalabs/core-wallets-sdk'
import {
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  Network,
  NetworkVMType
} from '@avalabs/core-chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { avaxSerial } from '@avalabs/avalanchejs'
import { TransactionResponse } from 'ethers'
import { Networks } from 'store/network/types'
import Config from 'react-native-config'
import Logger from 'utils/Logger'
import { getBitcoinProvider, getEvmProvider } from './utils/providerUtils'
import { NETWORK_P, NETWORK_P_TEST, NETWORK_X, NETWORK_X_TEST } from './consts'

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
      [ChainId.AVALANCHE_P]: this.getAvalancheNetworkP(false),
      [ChainId.AVALANCHE_TEST_P]: this.getAvalancheNetworkP(true),
      [ChainId.AVALANCHE_X]: this.getAvalancheNetworkX(false),
      [ChainId.AVALANCHE_TEST_X]: this.getAvalancheNetworkX(true)
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
   * Returns the network object for Avalanche P Chain
   */
  getAvalancheNetworkP(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? NETWORK_P_TEST : NETWORK_P
  }

  /**
   * Returns the network object for Avalanche X Chain
   */
  getAvalancheNetworkX(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? NETWORK_X_TEST : NETWORK_X
  }
  /**
   * Returns the provider used by Avalanche X/P/CoreEth chains.
   * Using either X or P Network will result in same provider.
   */
  getAvalancheProviderXP(isDeveloperMode: boolean): Avalanche.JsonRpcProvider {
    const network = this.getAvalancheNetworkP(isDeveloperMode)
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
