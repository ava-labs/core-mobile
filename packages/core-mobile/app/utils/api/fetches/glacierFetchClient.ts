import Config from 'react-native-config'

import {
  BlockchainId,
  Network as GlacierNetwork,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import { glacierApi } from '../clients/glacierApiClient'

// RPC urls returned in the token list are always using the production URL
const knownHosts = ['glacier-api.avax.network', 'proxy-api.avax.network']

export const listLatestPrimaryNetworkTransactions = async ({
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
    const result = await glacierApi.GET(
      '/v1/networks/{network}/blockchains/{blockchainId}/transactions',
      {
        params: {
          path: {
            network: isTestnet ? GlacierNetwork.FUJI : GlacierNetwork.MAINNET,
            blockchainId: BlockchainId.P_CHAIN
          }
        },
        queries: {
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
    )

    pageToken = result?.data?.nextPageToken
    transactions.push(...(result?.data?.transactions as PChainTransaction[]))
  } while (pageToken)

  return transactions
}

/**
 * Glacier needs an API key for development, this adds the key if needed.
 */
export function addGlacierAPIKeyIfNeeded(url: string): string {
  const urlObj = new URL(url)

  if (Config.GLACIER_API_KEY && knownHosts.includes(urlObj.hostname)) {
    const search_params = urlObj.searchParams // copy, does not update the URL
    search_params.set('token', Config.GLACIER_API_KEY)
    urlObj.search = search_params.toString()
    return urlObj.toString()
  }

  return url
}
