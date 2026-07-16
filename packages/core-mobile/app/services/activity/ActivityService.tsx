import { getAddressByNetwork } from 'store/account/utils'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { Network } from '@avalabs/core-chains-sdk'
import {
  Module,
  Transaction as InternalTransaction,
  TxToken
} from '@avalabs/vm-module-types'
import Logger from 'utils/Logger'
import { getCachedTokenList } from 'hooks/networks/useTokenList'
import { queryClient } from 'contexts/ReactQueryProvider'
import { ReactQueryKeys } from 'consts/reactQueryKeys'
import { AdjustedNormalizedBalancesForAccount } from 'services/balance/types'
import { isAvalancheCChainId } from 'services/network/utils/isAvalancheNetwork'
import GlacierService from 'services/glacier/GlacierService'
import { Transaction } from 'store/transaction'
import { ActivityResponse, GetActivitiesForAccountParams } from './types'
import { convertTransaction } from './utils/convertTransaction'
import { convertCChainAtomicTransaction } from './utils/convertCChainAtomicTransaction'

const UNKNOWN_TOKEN_SYMBOL = 'Unknown'

export class ActivityService {
  async getActivities({
    network,
    account,
    nextPageToken,
    shouldAnalyzeBridgeTxs = true,
    pageSize = 30
  }: GetActivitiesForAccountParams): Promise<ActivityResponse> {
    const address = getAddressByNetwork(account, network)

    if (!address) {
      throw new Error(
        `No address found for account on network ${network.vmName}`
      )
    }

    // Populate network with tokens for SVM networks if needed
    const networkWithTokens = await this.enrichNetworkWithTokens(network)

    // Kick off the C-Chain atomic fetch concurrently with the EVM history
    // fetch below — it doesn't depend on the EVM result, and both are
    // separate Glacier round-trips, so starting them in parallel avoids
    // serializing the C-Chain activity critical path.
    const atomicPromise = this.fetchCChainAtomicTransactions({
      network: networkWithTokens,
      address,
      nextPageToken
    })

    const module = await ModuleManager.loadModuleByNetwork(networkWithTokens)

    const rawTxHistory = await module.getTransactionHistory({
      network: mapToVmNetwork(networkWithTokens),
      address,
      nextPageToken,
      offset: pageSize
    })

    // Resolve any tokens that the SVM module couldn't match (symbol === "Unknown")
    const enrichedTxs = await this.resolveUnknownTokenSymbols(
      rawTxHistory.transactions,
      networkWithTokens,
      module
    )

    const transactions = enrichedTxs.map(tx =>
      convertTransaction(tx, shouldAnalyzeBridgeTxs)
    )

    const atomicTxs = await atomicPromise
    const withAtomic = atomicTxs.length
      ? this.mergeAtomicTransactions(transactions, atomicTxs)
      : transactions

    return {
      transactions: withAtomic,
      nextPageToken: rawTxHistory.nextPageToken
    }
  }

  /**
   * C-Chain atomic import/export txs come from a separate Glacier endpoint the
   * EVM module never calls (CP-14760). Fetch them for the first page only —
   * the recent-activity view is a single 100-item page, so this covers the
   * token detail + activity tab. Best-effort: a failure here must not break
   * the primary EVM history, so all errors are swallowed and logged, which
   * also makes it safe to kick off this fetch before awaiting the EVM
   * history fetch (the returned promise never rejects).
   */
  private async fetchCChainAtomicTransactions({
    network,
    address,
    nextPageToken
  }: {
    network: Network
    address: string
    nextPageToken?: string
  }): Promise<Transaction[]> {
    if (nextPageToken !== undefined) return []
    if (!isAvalancheCChainId(network.chainId)) return []

    try {
      const atomic = await GlacierService.listCChainAtomicTransactions({
        address,
        isTestnet: Boolean(network.isTestnet)
      })

      return atomic.transactions.map(tx =>
        convertCChainAtomicTransaction(tx, {
          chainId: network.chainId,
          explorerUrl: network.explorerUrl
        })
      )
    } catch (error) {
      Logger.error('Failed to fetch C-Chain atomic transactions', error)
      return []
    }
  }

  private mergeAtomicTransactions(
    transactions: Transaction[],
    atomicTxs: Transaction[]
  ): Transaction[] {
    const seen = new Set(transactions.map(t => t.hash))
    const merged = [
      ...transactions,
      ...atomicTxs.filter(t => !seen.has(t.hash))
    ]
    merged.sort((a, b) => b.timestamp - a.timestamp)
    return merged
  }

  /**
   * Enriches SVM networks with SPL token metadata for proper transaction history display.
   *
   * Unlike EVM networks which include token metadata in the main /networks endpoint,
   * Solana networks return empty tokens arrays and require fetching from /tokenlist?includeSolana.
   * This ensures SPL tokens show proper symbols (e.g., "ORCA") instead of "Unknown" in activity.
   *
   * TODO: when integrating with networks api v2, recheck this to see if it is still needed
   */
  private async enrichNetworkWithTokens(network: Network): Promise<Network> {
    if (network.vmName !== NetworkVMType.SVM) {
      return network
    }

    try {
      const tokens = await getCachedTokenList()
      const tokenListTokens = tokens[network.chainId]?.tokens ?? []

      if (tokenListTokens.length === 0) {
        return network
      }

      // Always merge token list tokens with any existing tokens on the network,
      // rather than skipping when network.tokens is non-empty.
      // The /networks endpoint may return a partial list, so we need to
      // supplement it with tokens from /tokenlist.
      const existingTokens = network.tokens ?? []
      const existingAddresses = new Set(
        existingTokens.map(t => t.address.toLowerCase())
      )

      const mergedTokens = [
        ...existingTokens,
        ...tokenListTokens.filter(
          t => !existingAddresses.has(t.address.toLowerCase())
        )
      ]

      return {
        ...network,
        tokens: mergedTokens
      }
    } catch (error) {
      Logger.error('Failed to fetch SPL token metadata', error)
      return network
    }
  }

  /**
   * Resolves "Unknown" token symbols in transactions using multiple data sources:
   * 1. Module's token registry (/solana-tokens endpoint)
   * 2. User's cached balance data (React Query cache)
   *
   * The SVM module falls back to symbol: "Unknown" when a token's mint address
   * is not found in network.tokens. This method provides additional resolution layers.
   */
  private async resolveUnknownTokenSymbols(
    transactions: InternalTransaction[],
    network: Network,
    module: Module
  ): Promise<InternalTransaction[]> {
    if (network.vmName !== NetworkVMType.SVM) {
      return transactions
    }

    const unknownAddresses = this.collectUnknownTokenAddresses(transactions)

    if (unknownAddresses.size === 0) {
      return transactions
    }

    // Build a combined token metadata map from multiple sources
    const tokenMap = new Map<string, { symbol: string; name: string }>()

    // Source 1: Module's token registry
    await this.populateFromModuleTokens(tokenMap, network, module)

    // Source 2: User's cached balance data
    this.populateFromBalanceCache(tokenMap, network.chainId)

    return this.applyTokenMetadata(transactions, tokenMap)
  }

  private async populateFromModuleTokens(
    tokenMap: Map<string, { symbol: string; name: string }>,
    network: Network,
    module: Module
  ): Promise<void> {
    try {
      const moduleTokens = await module.getTokens(mapToVmNetwork(network))

      for (const token of moduleTokens) {
        if ('address' in token && 'symbol' in token && token.symbol) {
          tokenMap.set(token.address, {
            symbol: token.symbol,
            name: 'name' in token && token.name ? token.name : token.symbol
          })
        }
      }
    } catch (error) {
      Logger.warn('Failed to fetch module tokens for resolution', error)
    }
  }

  /**
   * Looks up token metadata from the user's cached balance data.
   */
  private populateFromBalanceCache(
    tokenMap: Map<string, { symbol: string; name: string }>,
    chainId: number
  ): void {
    try {
      const cachedBalances = queryClient.getQueriesData<
        AdjustedNormalizedBalancesForAccount[]
      >({
        queryKey: [ReactQueryKeys.ACCOUNT_BALANCE]
      })

      const tokens = this.extractTokensFromBalanceCache(cachedBalances, chainId)

      for (const { address, symbol, name } of tokens) {
        if (!tokenMap.has(address)) {
          tokenMap.set(address, { symbol, name })
        }
      }
    } catch (error) {
      Logger.warn('Failed to read balance cache for token resolution', error)
    }
  }

  private extractTokensFromBalanceCache(
    cachedBalances: [
      unknown,
      AdjustedNormalizedBalancesForAccount[] | undefined
    ][],
    chainId: number
  ): { address: string; symbol: string; name: string }[] {
    const seen = new Set<string>()

    return cachedBalances
      .flatMap(([, balanceData]) => balanceData ?? [])
      .filter(networkBalance => networkBalance.chainId === chainId)
      .flatMap(networkBalance => networkBalance.tokens)
      .reduce<{ address: string; symbol: string; name: string }[]>(
        (result, token) => {
          const address = 'address' in token ? String(token.address) : undefined

          if (address && token.symbol && !seen.has(address)) {
            seen.add(address)
            result.push({
              address,
              symbol: token.symbol,
              name: token.name ?? token.symbol
            })
          }

          return result
        },
        []
      )
  }

  private applyTokenMetadata(
    transactions: InternalTransaction[],
    tokenMap: Map<string, { symbol: string; name: string }>
  ): InternalTransaction[] {
    return transactions.map(tx => ({
      ...tx,
      tokens: tx.tokens.map(token => {
        if (token.symbol !== UNKNOWN_TOKEN_SYMBOL || !('address' in token)) {
          return token
        }

        const found = tokenMap.get(token.address)

        if (found) {
          return {
            ...token,
            symbol: found.symbol,
            name: found.name
          } as TxToken
        }

        Logger.warn(
          `Unable to resolve SPL token metadata for mint: ${token.address}`
        )

        return token
      })
    }))
  }

  private collectUnknownTokenAddresses(
    transactions: InternalTransaction[]
  ): Set<string> {
    const unknownAddresses = new Set<string>()

    for (const tx of transactions) {
      for (const token of tx.tokens) {
        if (token.symbol === UNKNOWN_TOKEN_SYMBOL && 'address' in token) {
          unknownAddresses.add(token.address)
        }
      }
    }

    return unknownAddresses
  }
}

export default new ActivityService()
