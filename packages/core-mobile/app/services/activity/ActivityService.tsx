import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import Logger from 'utils/Logger'
import { getCachedTokenList } from 'hooks/networks/useTokenList'
import { ActivityResponse, GetActivitiesForAccountParams } from './types'
import { convertTransaction } from './utils/convertTransaction'

export class ActivityService {
  async getActivities({
    network,
    account,
    nextPageToken,
    shouldAnalyzeBridgeTxs = true,
    pageSize = 30
  }: GetActivitiesForAccountParams): Promise<ActivityResponse> {
    const address = getAddressByNetwork(account, network)

    // Populate network with tokens for SVM networks if needed
    const networkWithTokens = await this.enrichNetworkWithTokens(network)

    const module = await ModuleManager.loadModuleByNetwork(networkWithTokens)

    const rawTxHistory = await module.getTransactionHistory({
      network: mapToVmNetwork(networkWithTokens),
      address,
      nextPageToken,
      offset: pageSize
    })

    const transactions = rawTxHistory.transactions.map(tx =>
      convertTransaction(tx, shouldAnalyzeBridgeTxs)
    )

    return {
      transactions,
      nextPageToken: rawTxHistory.nextPageToken
    }
  }

  /**
   * Enriches SVM networks with SPL token metadata for proper transaction history display.
   *
   * Unlike EVM networks which include token metadata in the main /networks endpoint,
   * Solana networks return empty tokens arrays and require fetching from /tokenlist?includeSolana.
   * This ensures SPL tokens show proper symbols (e.g., "ORCA") instead of "Unknown" in activity.
   */
  private async enrichNetworkWithTokens(network: Network): Promise<Network> {
    // Only enrich SVM networks that don't already have tokens
    if (
      network.vmName !== NetworkVMType.SVM ||
      (network.tokens && network.tokens.length > 0)
    ) {
      return network
    }

    try {
      const tokens = await getCachedTokenList()
      const networkTokens = tokens[network.chainId]?.tokens ?? []

      return {
        ...network,
        tokens: networkTokens
      }
    } catch (error) {
      Logger.error('Failed to fetch SPL token metadata', error)
      return network
    }
  }
}

export default new ActivityService()
