import {
  BlockchainId,
  Network as GlacierNetwork,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import Config from 'react-native-config'
import { glacierApi } from '../clients/glacierApiClient'
import { GlacierApiHttpClient as HttpClient } from '../types'

// RPC urls returned in the token list are always using the production URL
const knownHosts = ['glacier-api.avax.network', 'proxy-api.avax.network']

/**
 * High-level client interface for watchlist operations
 * Abstracts away HTTP details and provides typed domain methods
 */
export type GlacierApiClient = {
  listLatestPrimaryNetworkTransactions: ({
    isTestnet,
    addresses,
    startTimestamp,
    sortOrder
  }: {
    isTestnet: boolean
    addresses: string[]
    startTimestamp?: number
    sortOrder?: SortOrder
  }) => Promise<PChainTransaction[]>

  addGlacierAPIKeyIfNeeded: (url: string) => string
}

export const createGlacierApiClient = (
  httpClient: HttpClient
): GlacierApiClient => {
  const listLatestPrimaryNetworkTransactions = async ({
    isTestnet,
    addresses,
    startTimestamp,
    sortOrder = SortOrder.DESC
  }: {
    isTestnet: boolean
    addresses: string[]
    startTimestamp?: number
    sortOrder?: SortOrder
  }): Promise<PChainTransaction[]> => {
    const addressesStr = addresses.join(',')
    let pageToken: string | undefined
    const transactions: PChainTransaction[] = []

    do {
      const { data } = await httpClient.GET(
        '/v1/networks/{network}/blockchains/{blockchainId}/transactions',
        {
          params: {
            path: {
              network: isTestnet ? GlacierNetwork.FUJI : GlacierNetwork.MAINNET,
              blockchainId: BlockchainId.P_CHAIN
            },
            query: {
              addresses: addressesStr,
              pageSize: 100,
              sortOrder,
              pageToken,
              txTypes: [
                PChainTransactionType.ADD_PERMISSIONLESS_DELEGATOR_TX,
                PChainTransactionType.ADD_DELEGATOR_TX
              ],
              startTimestamp
            }
          }
        }
      )

      pageToken = data?.nextPageToken
      transactions.push(...(data?.transactions as PChainTransaction[]))
    } while (pageToken)

    return transactions
  }

  /**
   * Glacier needs an API key for development, this adds the key if needed.
   */

  const addGlacierAPIKeyIfNeeded = (url: string): string => {
    const urlObj = new URL(url)

    if (Config.GLACIER_API_KEY && knownHosts.includes(urlObj.hostname)) {
      const search_params = urlObj.searchParams // copy, does not update the URL
      search_params.set('token', Config.GLACIER_API_KEY)
      urlObj.search = search_params.toString()
      return urlObj.toString()
    }

    return url
  }

  return {
    listLatestPrimaryNetworkTransactions,
    addGlacierAPIKeyIfNeeded
  }
}

/**
 * Default Glacier API client instance using glacierApi
 * Use this for production code when you don't need custom configuration
 */
export const glacierApiClient: GlacierApiClient =
  createGlacierApiClient(glacierApi)
