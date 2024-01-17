import {
  Avalanche,
  BlockCypherProvider,
  JsonRpcBatchInternal
} from '@avalabs/wallets-sdk'
import {
  AVALANCHE_XP_NETWORK,
  AVALANCHE_XP_TEST_NETWORK,
  BITCOIN_NETWORK,
  BITCOIN_TEST_NETWORK,
  ChainId,
  getChainsAndTokens,
  Network,
  NetworkVMType
} from '@avalabs/chains-sdk'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Transaction } from '@sentry/types'
import { avaxSerial } from '@avalabs/avalanchejs-v2'
import AnalyticsService from 'services/analytics/AnalyticsService'
import { getBitcoinProvider, getEvmProvider } from './utils/providerUtils'

class NetworkService {
  async getNetworks(): Promise<{ [chainId: number]: Network }> {
    const erc20Networks = await getChainsAndTokens(!__DEV__)

    delete erc20Networks[ChainId.AVALANCHE_LOCAL_ID]

    return {
      ...erc20Networks,
      [ChainId.BITCOIN]: BITCOIN_NETWORK,
      [ChainId.BITCOIN_TESTNET]: BITCOIN_TEST_NETWORK
    }
  }

  getProviderForNetwork(
    network: Network
  ): JsonRpcBatchInternal | BlockCypherProvider | Avalanche.JsonRpcProvider {
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

  async sendTransaction(
    signedTx: string | avaxSerial.SignedTx,
    network: Network,
    waitToPost = false,
    sentryTrx?: Transaction
  ): Promise<string> {
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

            if (waitToPost) {
              await tx.wait()
            }
            txID = tx.hash
          } else if (provider instanceof BlockCypherProvider) {
            txID = (await provider.issueRawTx(signedTx)).hash
          }
        }

        if (txID === undefined) {
          throw new Error('No provider found')
        }

        if (!network.isTestnet) {
          AnalyticsService.capture('CollectTransactionHash', {
            txID,
            chainId: network.chainId,
            chainName: network.chainName
          })
        }

        return txID
      })
  }

  /**
   * Returns the network object for Avalanche X/P Chains
   */
  getAvalancheNetworkXP(isDeveloperMode: boolean): Network {
    return isDeveloperMode ? AVALANCHE_XP_TEST_NETWORK : AVALANCHE_XP_NETWORK
  }

  /**
   * Returns the provider used by Avalanche X/P/CoreEth chains.
   */
  getAvalancheProviderXP(isDeveloperMode: boolean): Avalanche.JsonRpcProvider {
    const network = this.getAvalancheNetworkXP(isDeveloperMode)
    return this.getProviderForNetwork(network) as Avalanche.JsonRpcProvider
  }
}

export default new NetworkService()
