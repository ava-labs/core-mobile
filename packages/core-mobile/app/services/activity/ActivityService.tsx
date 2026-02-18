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
import { ActivityResponse, GetActivitiesForAccountParams } from './types'
import { convertTransaction } from './utils/convertTransaction'

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

    // Source 1: Module's token registry (/solana-tokens endpoint)
    await this.populateFromModuleTokens(tokenMap, network, module)

    // Source 2: User's cached balance data (already fetched, no extra API call)
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
   * This data is already fetched and cached by the balance service,
   * so this is a free in-memory lookup with no additional API calls.
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

      for (const [, balanceData] of cachedBalances) {
        if (!balanceData) continue

        for (const networkBalance of balanceData) {
          if (networkBalance.chainId !== chainId) continue

          for (const token of networkBalance.tokens) {
            const address =
              'address' in token ? String(token.address) : undefined

            if (address && token.symbol) {
              // Only add if not already present from a higher-priority source
              if (!tokenMap.has(address)) {
                tokenMap.set(address, {
                  symbol: token.symbol,
                  name: token.name ?? token.symbol
                })
              }
            }
          }
        }
      }
    } catch (error) {
      Logger.warn('Failed to read balance cache for token resolution', error)
    }
  }

  private applyTokenMetadata(
    transactions: InternalTransaction[],
    tokenMap: Map<string, { symbol: string; name: string }>
  ): InternalTransaction[] {
    return transactions.map(tx => ({
      ...tx,
      tokens: tx.tokens.map(token => {
        if (
          token.symbol !== UNKNOWN_TOKEN_SYMBOL ||
          !('address' in token)
        ) {
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
