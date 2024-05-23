import { glacierSdk } from 'utils/network/glacier'
import { getBlockChainIdForPrimaryNetwork } from 'services/network/utils/getBlockChainIdForPrimaryNetwork'
import {
  ListCChainAtomicTransactionsResponse,
  ListPChainTransactionsResponse,
  ListXChainTransactionsResponse,
  Network,
  PrimaryNetworkChainName,
  SortOrder
} from '@avalabs/glacier-sdk'
import { Transaction } from 'store/transaction'
import { convertXChainTransaction } from 'services/activity/utils/convertXChainTransaction'
import { convertPChainTransaction } from 'services/activity/utils/convertPChainTransaction'
import {
  ActivityResponse,
  GetActivitiesForAddressParams,
  NetworkActivityService
} from './types'

export class PrimaryActivityService implements NetworkActivityService {
  async getActivities(
    params: GetActivitiesForAddressParams
  ): Promise<ActivityResponse> {
    const { address, network, nextPageToken, pageSize } = params
    const response =
      await glacierSdk.primaryNetworkTransactions.listLatestPrimaryNetworkTransactions(
        {
          addresses: address,
          blockchainId: getBlockChainIdForPrimaryNetwork(network),
          network: network.isTestnet ? Network.FUJI : Network.MAINNET,
          pageSize,
          pageToken: nextPageToken,
          sortOrder: SortOrder.DESC
        }
      )

    let transactions: Transaction[] = []
    if (this.isPChainTransactions(response)) {
      transactions = response.transactions.map(value =>
        convertPChainTransaction(value, network, address)
      )
    }
    if (this.isXChainTransactions(response)) {
      transactions = response.transactions.map(value =>
        convertXChainTransaction(value, network, address)
      )
    }

    return {
      transactions,
      nextPageToken: response.nextPageToken
    }
  }

  isPChainTransactions(
    value:
      | ListPChainTransactionsResponse
      | ListXChainTransactionsResponse
      | ListCChainAtomicTransactionsResponse
  ): value is ListPChainTransactionsResponse {
    return value.chainInfo.chainName === PrimaryNetworkChainName.P_CHAIN
  }

  isXChainTransactions(
    value:
      | ListPChainTransactionsResponse
      | ListXChainTransactionsResponse
      | ListCChainAtomicTransactionsResponse
  ): value is ListXChainTransactionsResponse {
    return value.chainInfo.chainName === PrimaryNetworkChainName.X_CHAIN
  }
}

export default new PrimaryActivityService()
