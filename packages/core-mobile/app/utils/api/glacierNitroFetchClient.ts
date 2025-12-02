import { fetchWithNitro } from 'avalabs-nitro-fetch'
import Config from 'react-native-config'
import createClient from 'openapi-fetch'
import queryString from 'query-string'
import { CORE_HEADERS } from 'utils/network/constants'
import {
  BlockchainId,
  Network as GlacierNetwork,
  PChainTransaction,
  PChainTransactionType,
  SortOrder
} from '@avalabs/glacier-sdk'
import Logger from 'utils/Logger'
import type { paths } from '../../generated/api/glacier/schema'

if (!Config.GLACIER_URL) Logger.warn('GLACIER_URL ENV is missing')

export const GLACIER_URL = Config.GLACIER_URL

// RPC urls returned in the token list are always using the production URL
const knownHosts = ['glacier-api.avax.network', 'proxy-api.avax.network']

const glacierApi = createClient<paths>({
  baseUrl: Config.GLACIER_URL,
  fetch: r => fetchWithNitro(r),
  headers: CORE_HEADERS,
  querySerializer: params =>
    queryString.stringify(params, { arrayFormat: 'comma' })
})

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
