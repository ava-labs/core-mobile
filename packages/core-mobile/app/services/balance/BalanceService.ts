import { Network } from '@avalabs/core-chains-sdk'

import { SPAN_STATUS_ERROR } from '@sentry/core'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import {
  type NetworkContractToken,
  type TokenWithBalance,
  type Error,
  TokenType,
  GetBalancesResponse as VmGetBalancesResponse
} from '@avalabs/vm-module-types'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  isPChain,
  isXChain,
  isXPNetwork
} from 'utils/network/isAvalancheNetwork'
import { AddressIndex } from '@avalabs/types'
import Logger from 'utils/Logger'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { GetBalancesRequestBody } from 'utils/apiClient/generated/balanceApi.client'
import { balanceApi } from 'utils/apiClient/balance/balanceApi'
import { AdjustedNormalizedBalancesForAccount } from './types'
import { AVAX_P_ID, AVAX_X_ID } from './const'
import { getLocalTokenId } from './utils/getLocalTokenId'
import { mapBalanceResponseToLegacy } from './utils/mapBalanceResponseToLegacy'
import { buildRequestItemsForAccount } from './utils/buildRequestItemsForAccount'

type AccountId = string

export class BalanceService {
  /**
   * Fetch balances for multiple accounts across multiple networks.
   * Uses Promise.allSettled so each network resolves independently.
   *
   * @returns a map of accountId → AdjustedNormalizedBalancesForAccount[]
   * @example
   * {
   *   'some-account-id': [
   *     {
   *       accountId: 'some-account-id',
   *       chainId: 43114,
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
      partial: Record<AccountId, AdjustedNormalizedBalancesForAccount>
    ) => void
  }): Promise<Record<AccountId, AdjustedNormalizedBalancesForAccount[]>> {
    // Final aggregated result
    const finalResults: Record<
      AccountId,
      AdjustedNormalizedBalancesForAccount[]
    > = {}
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
          const partial: Record<
            AccountId,
            AdjustedNormalizedBalancesForAccount
          > = {}

          try {
            const module = await ModuleManager.loadModuleByNetwork(network)

            const addressEntries = accounts.flatMap(account =>
              getAddressesForAccountAndNetwork(account, network).map(
                address => ({
                  address,
                  account
                })
              )
            )

            const addressMap = addressEntries.reduce(
              (acc, { address, account }) => {
                if (address) {
                  acc[address] = account
                }
                return acc
              },
              {} as Record<string, Account>
            )

            const addresses = Object.keys(addressMap)
            const customTokensForNetwork =
              customTokens[network.chainId.toString()] ?? []
            const storage = coingeckoInMemoryCache

            let balancesResponse: VmGetBalancesResponse

            /**
             * SPECIAL CASE:
             * For AVM / PVM network, module.getBalances()
             * only returns the first address.
             * → We must loop each address and run getBalances in parallel.
             */
            if (isXPNetwork(network)) {
              const perAddressPromises = addresses.map(address =>
                module
                  .getBalances({
                    customTokens: customTokensForNetwork,
                    addresses: [address],
                    currency,
                    network: mapToVmNetwork(network),
                    storage,
                    tokenTypes: [TokenType.NATIVE]
                  })
                  .then(res => ({ address, res }))
                  .catch(err => ({
                    address,
                    res: { [address]: { error: err as Error } }
                  }))
              )

              const settled = await Promise.allSettled(perAddressPromises)

              balancesResponse = settled.reduce((acc, r) => {
                if (r.status === 'fulfilled') {
                  const { address, res } = r.value
                  acc[address] = Object.assign({}, res[address])
                }
                return acc
              }, {} as VmGetBalancesResponse)

              /**
               * NORMAL CASE :
               * For other networks, module.getBalances() handles batching correctly
               * For AVM / PVM network, module.getBalances()
               */
            } else {
              const tokenTypes =
                network.vmName === NetworkVMType.SVM
                  ? [TokenType.NATIVE, TokenType.SPL]
                  : [TokenType.NATIVE, TokenType.ERC20]

              balancesResponse = await module.getBalances({
                customTokens: customTokensForNetwork,
                addresses,
                currency,
                network: mapToVmNetwork(network),
                storage,
                tokenTypes
              })
            }

            // Process accounts
            for (const address of addresses) {
              const account = addressMap[address]
              const balances = balancesResponse[address]

              if (!account || !balances) continue

              if ('error' in balances) {
                partial[account.id] = {
                  accountId: account.id,
                  chainId: network.chainId,
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
              AdjustedNormalizedBalancesForAccount
            > = {}

            // Mark all accounts errored for this network
            for (const account of accounts) {
              errorPartial[account.id] = {
                accountId: account.id,
                chainId: network.chainId,
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

  /**
   * Fetch balances for a single account across multiple networks using the
   * Balance Service streaming API.
   *
   * @returns an array of AdjustedNormalizedBalancesForAccount objects,
   *          one entry per network/namespace included in the request.
   *
   * @example
   * [
   *   {
   *     accountId: 'some-account-id',
   *     chainId: 43114,
   *     tokens: [
   *       {
   *         name: 'Avalanche',
   *         symbol: 'AVAX',
   *         type: 'native',
   *         decimals: 18,
   *         balance: '1000000000000000000',
   *         price: 13.5,
   *         balanceInCurrency: 13.5
   *       }
   *     ],
   *     dataAccurate: true,
   *     error: null
   *   }
   * ]
   */
  async getBalancesForAccount({
    networks,
    account,
    currency,
    onBalanceLoaded
  }: {
    networks: Network[]
    account: Account
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
  }): Promise<AdjustedNormalizedBalancesForAccount[]> {
    // Final aggregated result
    const finalResults = new Map<number, AdjustedNormalizedBalancesForAccount>()

    const requestItems = buildRequestItemsForAccount(networks, account)

    const body = {
      data: requestItems,
      currency: currency as GetBalancesRequestBody['currency'],
      showUntrustedTokens: false
    }

    let balanceApiThrew = false
    const failedChainIds = new Set<number>()

    try {
      for await (const balance of balanceApi.getBalancesStream(body)) {
        const normalized = mapBalanceResponseToLegacy(account, balance)
        if (!normalized) continue

        if (normalized.error) {
          // Mark chain as failed
          failedChainIds.add(normalized.chainId)
        } else {
          // Progressive update callback for successful balance
          onBalanceLoaded?.(normalized)
        }

        // Add to final result
        finalResults.set(normalized.chainId, normalized)
      }
    } catch (err) {
      // Balance API down / request failed / stream broken
      balanceApiThrew = true
    }

    // If the balance API threw, we want to retry for all networks.
    // Otherwise, we only retry failed networks.
    const networksToRetry = balanceApiThrew
      ? networks
      : networks.filter(n => failedChainIds.has(n.chainId))

    // Retry with vm modules
    if (networksToRetry.length > 0) {
      Logger.info(
        `[BalanceService][getBalancesForAccount] retrying with vm modules for networks: ${networksToRetry
          .map(n => n.chainId)
          .join(', ')}`
      )
      const vmResults = await this.getBalancesForAccountViaVmModules({
        networks: networksToRetry,
        account,
        currency,
        onBalanceLoaded
      })

      vmResults.forEach(balance => finalResults.set(balance.chainId, balance))
    }

    return Array.from(finalResults.values())
  }

  private async getBalancesForAccountViaVmModules({
    networks,
    account,
    currency,
    onBalanceLoaded
  }: {
    networks: Network[]
    account: Account
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
  }): Promise<AdjustedNormalizedBalancesForAccount[]> {
    if (networks.length === 0) return []

    const res = await this.getBalancesForAccounts({
      networks,
      accounts: [account],
      currency,
      customTokens: {},
      onBalanceLoaded: (_chainId, partial) => {
        const b = partial[account.id]
        if (b) onBalanceLoaded?.(b)
      }
    })

    return res[account.id] ?? []
  }
}

const getAddressesForAccountAndNetwork = (
  account: Account,
  network: Network
): string[] => {
  if (isXPNetwork(network)) {
    const xpAddresses = account.xpAddresses
    if (xpAddresses && xpAddresses.length > 0) {
      const formatted = formatXpAddressesForNetwork(xpAddresses, network)
      if (formatted.length > 0) {
        return formatted
      }
    }
  }

  const defaultAddress = getAddressByNetwork(account, network)
  return defaultAddress ? [defaultAddress] : []
}

const formatXpAddressesForNetwork = (
  xpAddresses: AddressIndex[],
  network: Network
): string[] => {
  const prefix =
    network.vmName === NetworkVMType.AVM
      ? 'X-'
      : network.vmName === NetworkVMType.PVM
      ? 'P-'
      : undefined

  if (!prefix) {
    return []
  }

  const normalized = new Set<string>()
  xpAddresses.forEach(({ address }) => {
    if (!address) {
      return
    }
    const prefixed = address.startsWith(prefix)
      ? address
      : `${prefix}${address}`
    normalized.add(prefixed)
  })

  return [...normalized]
}

export default new BalanceService()