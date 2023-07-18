import { getErc20Txs, getNormalTxs } from '@avalabs/etherscan-sdk'
import { isEthereumNetwork } from 'services/network/utils/isEthereumNetwork'
import { glacierSdk } from 'utils/network/glacier'
import {
  ActivityResponse,
  GetActivitiesForAddressParams,
  NetworkActivityService
} from './types'
import { convertTransaction } from './utils/evmTransactionConverter'
import * as EtherscanConverter from './utils/etherscanTransactionConverter'

export class EvmActivityService implements NetworkActivityService {
  async getActivities(params: GetActivitiesForAddressParams) {
    return isEthereumNetwork(params.network)
      ? getTransactionsFromEtherscan(params)
      : getTransactionsFromGlacier(params)
  }
}

async function getTransactionsFromGlacier({
  network,
  address,
  nextPageToken,
  pageSize,
  criticalConfig
}: GetActivitiesForAddressParams): Promise<ActivityResponse> {
  const response = await glacierSdk.evm.listTransactions({
    chainId: network.chainId.toString(),
    address,
    pageToken: nextPageToken,
    pageSize
  })

  const transactions = response.transactions.map(item =>
    convertTransaction({
      item,
      network,
      address,
      criticalConfig
    })
  )

  return {
    transactions,
    nextPageToken: response.nextPageToken
  }
}

async function getTransactionsFromEtherscan({
  network,
  address,
  nextPageToken,
  pageSize: offset,
  criticalConfig
}: GetActivitiesForAddressParams): Promise<ActivityResponse> {
  /*
  Using JSON for nextPageToken because this function is managing both the Normal
  and ERC20 queries. It encodes the current page and the queries that should be
  run. For example, if 'normal' has no more records to fetch then it will be
  excluded from the list and the JSON will be something like:
  { page: 3, queries: ['erc20'] }
  */
  const parsedPageToken = nextPageToken
    ? (JSON.parse(nextPageToken) as EtherscanPagination)
    : undefined
  const page = parsedPageToken?.page || 1
  const queries = parsedPageToken?.queries || ['normal', 'erc20']

  const normalHist = (
    queries.includes('normal')
      ? await getNormalTxs(address, !network.isTestnet, { page, offset })
      : []
  ).map(tx => EtherscanConverter.convertTransactionNormal(tx, network, address))

  const erc20Hist = (
    queries.includes('erc20')
      ? await getErc20Txs(address, !network.isTestnet, undefined, {
          page,
          offset
        })
      : []
  ).map(tx =>
    EtherscanConverter.convertTransactionERC20(
      tx,
      network,
      address,
      criticalConfig
    )
  )

  // Filter erc20 transactions from normal tx list
  const erc20TxHashes = erc20Hist.map(tx => tx.hash)
  const filteredNormalTxs = normalHist.filter(tx => {
    return !erc20TxHashes.includes(tx.hash)
  })

  // Sort by timestamp
  const transactions = [...filteredNormalTxs, ...erc20Hist]
  transactions.sort((a, b) => b.timestamp - a.timestamp)

  const next: EtherscanPagination = { queries: [], page: page + 1 }
  if (normalHist.length) next.queries.push('normal')
  if (erc20Hist.length) next.queries.push('erc20')

  return {
    transactions,
    nextPageToken: next.queries.length ? JSON.stringify(next) : '' // stop pagination
  }
}

interface EtherscanPagination {
  queries: ('normal' | 'erc20')[]
  page: number | undefined
}

export default new EvmActivityService()
