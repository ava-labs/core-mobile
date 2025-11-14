import { Network } from '@avalabs/core-chains-sdk'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import {
  type NetworkContractToken,
  type TokenWithBalance,
  type Error,
  TokenType
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import { isPChain, isXChain } from 'utils/network/isAvalancheNetwork'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { NormalizedBalancesForAccount } from './types'
import { AVAX_P_ID, AVAX_X_ID } from './const'
import { getLocalTokenId } from './utils'

type AccountId = string

export class BalanceService {
  /**
   * Fetch balances for multiple accounts across multiple networks.
   * Uses Promise.allSettled so each network resolves independently.
   *
   * @returns a map of accountId → NormalizedBalancesForAccount[]
   * @example
   * {
   *   'some-account-id': [
   *     {
   *       accountId: 'some-account-id',
   *       chainId: 43114,
   *       accountAddress: '0x123',
   *       tokens: [
   *         {
   *           address: '0x123',
   *           balance: '100',
   *           decimals: 18,
   *           symbol: 'ETH',
   *           name: 'Ethereum'
   *         }
   *       ],
   *       dataAccurate: true,
   *       error: null
   *     }
   *   ]
   * }
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async getBalancesForAccounts({
    networks,
    accounts,
    currency,
    customTokens,
    onBalanceLoaded
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    customTokens: Record<string, NetworkContractToken[] | undefined>
    onBalanceLoaded?: (
      networkChainId: number,
      partial: Record<AccountId, NormalizedBalancesForAccount>
    ) => void
  }): Promise<Record<AccountId, NormalizedBalancesForAccount[]>> {
    // Final aggregated result
    const finalResults: Record<AccountId, NormalizedBalancesForAccount[]> = {}
    for (const account of accounts) {
      finalResults[account.id] = []
    }

    const networkPromises = networks.map(network =>
      SentryWrapper.startSpan(
        {
          name: 'get-balances',
          contextName: 'svc.balance.get_for_accounts',
          attributes: {
            chainId: network.chainId,
            chainName: network.chainName,
            accountLength: accounts.length
          }
        },
        async span => {
          // Prepare partial result for this single network
          const partial: Record<AccountId, NormalizedBalancesForAccount> = {}

          try {
            const module = await ModuleManager.loadModuleByNetwork(network)

            const tokenTypes =
              network.vmName === NetworkVMType.SVM
                ? [TokenType.NATIVE, TokenType.SPL]
                : [TokenType.NATIVE, TokenType.ERC20]

            // Map address → account
            const addressMap = accounts.reduce((acc, account) => {
              acc[getAddressByNetwork(account, network)] = account
              return acc
            }, {} as Record<string, Account>)

            const addresses = Object.keys(addressMap)

            const balancesResponse = await module.getBalances({
              customTokens: customTokens[network.chainId.toString()] ?? [],
              addresses,
              currency,
              network: mapToVmNetwork(network),
              storage: coingeckoInMemoryCache,
              tokenTypes
            })

            // Process accounts
            for (const address of addresses) {
              const account = addressMap[address]
              const balances = balancesResponse[address]

              if (!account || !balances) continue

              if ('error' in balances) {
                partial[account.id] = {
                  accountId: account.id,
                  chainId: network.chainId,
                  accountAddress: address,
                  tokens: [],
                  dataAccurate: false,
                  error: balances.error as Error
                }
                continue
              }

              const tokens = Object.values(balances)
                .filter((t): t is TokenWithBalance => !('error' in t))
                .map(token => {
                  const localId = isPChain(network.chainId)
                    ? AVAX_P_ID
                    : isXChain(network.chainId)
                    ? AVAX_X_ID
                    : getLocalTokenId(token)

                  return {
                    ...token,
                    localId,
                    networkChainId: network.chainId,
                    isDataAccurate: true
                  }
                })

              partial[account.id] = {
                accountId: account.id,
                chainId: network.chainId,
                accountAddress: address,
                tokens,
                dataAccurate: true,
                error: null
              }
            }

            // Progressive update callback
            onBalanceLoaded?.(network.chainId, partial)

            // Merge into final result
            for (const accountId of Object.keys(partial)) {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              finalResults[accountId]!.push(partial[accountId]!)
            }
          } catch (err) {
            span?.setStatus({
              code: SPAN_STATUS_ERROR,
              message: err instanceof Error ? err.message : 'unknown error'
            })

            Logger.error(
              `[BalanceService][getBalancesForAccounts] failed for network ${network.chainId}`,
              err
            )

            // Create error partial for this network
            const errorPartial: Record<
              AccountId,
              NormalizedBalancesForAccount
            > = {}

            // Mark all accounts errored for this network
            for (const account of accounts) {
              const address = getAddressByNetwork(account, network)

              errorPartial[account.id] = {
                accountId: account.id,
                chainId: network.chainId,
                accountAddress: address,
                tokens: [],
                dataAccurate: false,
                error: err as Error
              }

              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              finalResults[account.id]!.push(errorPartial[account.id]!)
            }
            // Still notify UI for progressive updates
            onBalanceLoaded?.(network.chainId, errorPartial)
          } finally {
            span?.end()
          }
        }
      )
    )

    // Execute everything in parallel
    await Promise.allSettled(networkPromises)

    return finalResults
  }
}

export default new BalanceService()
