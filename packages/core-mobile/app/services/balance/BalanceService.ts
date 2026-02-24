import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  type Error,
  type NetworkContractToken,
  TokenType,
  type TokenWithBalance,
  GetBalancesResponse as VmGetBalancesResponse
} from '@avalabs/vm-module-types'
import { SPAN_STATUS_ERROR } from '@sentry/core'
import SentryWrapper from 'services/sentry/SentryWrapper'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import { streamingBalanceApiClient } from 'utils/api/clients/balanceApiClient'
import { getSupportedChainsFromCache } from 'hooks/balance/useSupportedChains'
import { GetBalancesRequestBody } from 'utils/api/generated/balanceApi.client'
import { coingeckoInMemoryCache } from 'utils/coingeckoInMemoryCache'
import Logger from 'utils/Logger'
import {
  isPChain,
  isXChain,
  isXPNetwork
} from 'utils/network/isAvalancheNetwork'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import { AVAX_P_ID, AVAX_X_ID } from './const'
import {
  AdjustedNormalizedBalancesForAccount,
  AdjustedNormalizedBalancesForAccounts,
  PartialAdjustedNormalizedBalancesForAccount
} from './types'
import { buildRequestItemsForAccounts } from './utils/buildRequestItemsForAccounts'
import { getLocalTokenId } from './utils/getLocalTokenId'
import { mapBalanceResponseToLegacy } from './utils/mapBalanceResponseToLegacy'

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
  async getVMBalancesForAccounts({
    networks,
    accounts,
    currency,
    customTokens,
    onBalanceLoaded,
    xpAddressesByAccountId
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    customTokens: Record<string, NetworkContractToken[] | undefined>
    onBalanceLoaded?: (
      networkChainId: number,
      partial: PartialAdjustedNormalizedBalancesForAccount
    ) => void
    xpAddressesByAccountId: Map<string, string[]>
  }): Promise<AdjustedNormalizedBalancesForAccounts> {
    // Final aggregated result
    const finalResults: AdjustedNormalizedBalancesForAccounts = {}
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
          const partial: PartialAdjustedNormalizedBalancesForAccount = {}

          try {
            const module = await ModuleManager.loadModuleByNetwork(network)

            const addressEntries = accounts.flatMap(account =>
              getAddressesForAccountAndNetwork({
                account,
                network,
                xpAddresses: xpAddressesByAccountId.get(account.id) ?? []
              }).map(address => ({
                address,
                account
              }))
            )

            // Map each address to ALL owning accounts so that
            // imported-PK accounts that share the same address also receive
            // the balance.  EVM keys are normalized to lowercase for
            // case-insensitive lookups; other formats are kept as-is.
            const isEvm = network.vmName === NetworkVMType.EVM
            const addressMap = addressEntries.reduce(
              (acc, { address, account }) => {
                if (address) {
                  const key = normalizeAddressKey(address, isEvm)
                  if (!acc[key]) acc[key] = []
                  if (!acc[key].some(a => a.id === account.id)) {
                    acc[key].push(account)
                  }
                }
                return acc
              },
              {} as Record<string, Account[]>
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

            // Process accounts – iterate over the response addresses and
            // assign balances to every owning account (supports duplicate
            // addresses from imported-PK accounts).
            for (const responseAddress of Object.keys(balancesResponse)) {
              const matchedAccounts =
                addressMap[normalizeAddressKey(responseAddress, isEvm)]
              const balances = balancesResponse[responseAddress]

              if (!matchedAccounts || matchedAccounts.length === 0 || !balances)
                continue

              for (const account of matchedAccounts) {
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
              `[BalanceService][getVMBalancesForAccounts] failed for network ${network.chainId}`,
              err
            )

            // Create error partial for this network
            const errorPartial: PartialAdjustedNormalizedBalancesForAccount = {}

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
    onBalanceLoaded,
    xpAddresses,
    xpub
  }: {
    networks: Network[]
    account: Account
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
    xpAddresses: string[]
    xpub?: string
  }): Promise<AdjustedNormalizedBalancesForAccount[]> {
    // Final aggregated result
    const finalResults = new Map<number, AdjustedNormalizedBalancesForAccount>()

    const { networks: supportedNetworks, filteredOutChainIds } =
      await this.filterNetworksBySupportedEvm(networks)

    const requestBatches = buildRequestItemsForAccounts({
      networks: supportedNetworks,
      accounts: [account],
      xpAddressesByAccountId: new Map([[account.id, xpAddresses]]),
      xpubByAccountId: new Map([[account.id, xpub]])
    })

    const { balanceApiThrew, failedChainIds } =
      await this.processBalanceBatches({
        requestBatches,
        account,
        currency,
        finalResults,
        onBalanceLoaded
      })

    filteredOutChainIds.forEach(chainId => failedChainIds.add(chainId))

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
        onBalanceLoaded,
        xpAddresses
      })

      vmResults.forEach(balance => finalResults.set(balance.chainId, balance))
    }

    return Array.from(finalResults.values())
  }

  /**
   * Fetch balances for multiple accounts across multiple networks using the
   * Balance Service streaming API.
   *
   * Each streamed response is mapped back to an Account using:
   * - `response.id` (preferred: account.id)
   * - `response.id` as an address lookup (EVM/BTC/SVM commonly use address as id)
   *
   * @returns a map of accountId → AdjustedNormalizedBalancesForAccount[]
   */
  // eslint-disable-next-line sonarjs/cognitive-complexity
  async getBalancesForAccounts({
    networks,
    accounts,
    currency,
    onBalanceLoaded,
    xpAddressesByAccountId,
    xpubByAccountId
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
    xpAddressesByAccountId: Map<string, string[]>
    xpubByAccountId: Map<string, string | undefined>
  }): Promise<AdjustedNormalizedBalancesForAccounts> {
    const finalResults: AdjustedNormalizedBalancesForAccounts = {}

    for (const account of accounts) {
      finalResults[account.id] = []
    }

    const { networks: supportedNetworks, filteredOutChainIds } =
      await this.filterNetworksBySupportedEvm(networks)

    const requestBatches = buildRequestItemsForAccounts({
      networks: supportedNetworks,
      accounts,
      xpAddressesByAccountId,
      xpubByAccountId
    })

    const accountById = accounts.reduce((acc, a) => {
      acc[a.id] = a
      return acc
    }, {} as Record<string, Account>)

    // Map each address to ALL accounts that own it.
    // EVM keys are normalized to lowercase because the Balance API may return
    // addresses in a different case (e.g. lowercased) than what the account
    // stores (EIP-55 checksummed).  Non-EVM formats (base58 for BTC/X/P-Chain,
    // Solana) are case-sensitive and kept as-is.
    // With a single account the old `accounts.length === 1` fallback masked
    // mismatches; with 2+ accounts the fallback no longer applies.
    const accountsByAddress = accounts.reduce((acc, account) => {
      const xpAddresses = xpAddressesByAccountId.get(account.id) ?? []

      const addressesWithNetwork = supportedNetworks.flatMap(network =>
        getAddressesForAccountAndNetwork({
          account,
          network,
          xpAddresses
        }).map(address => ({
          address,
          isEvm: network.vmName === NetworkVMType.EVM
        }))
      )
      for (const { address, isEvm } of addressesWithNetwork) {
        if (address && address.length > 0) {
          const key = normalizeAddressKey(address, isEvm)
          if (!acc[key]) acc[key] = []
          if (!acc[key].some(a => a.id === account.id)) {
            acc[key].push(account)
          }
        }
      }
      return acc
    }, {} as Record<string, Account[]>)

    let balanceApiThrew = false
    const failedChainIds = new Set<number>()

    for (const requestItems of requestBatches) {
      if (requestItems.length === 0) continue

      const body = {
        data: requestItems,
        currency: currency as GetBalancesRequestBody['currency'],
        showUntrustedTokens: true
      }

      try {
        for await (const balance of streamingBalanceApiClient.getBalances(
          body
        )) {
          const id = 'id' in balance ? balance.id : undefined

          // Resolve to one or more matching accounts.
          // An address may map to multiple accounts when the same private key
          // has been imported, so we must assign the balance to every owner.
          // EVM lookups are case-insensitive to handle API response case
          // variance (checksummed vs lowercased).
          const isEvmBalance =
            'networkType' in balance && balance.networkType === 'evm'
          const matchedAccounts: Account[] = []

          if (id) {
            const byId = accountById[id]
            if (byId) {
              matchedAccounts.push(byId)
            } else {
              const byAddress =
                accountsByAddress[normalizeAddressKey(id, isEvmBalance)]
              if (byAddress) {
                matchedAccounts.push(...byAddress)
              }
            }
          }

          if (matchedAccounts.length === 0 && accounts.length === 1) {
            matchedAccounts.push(accounts[0]!)
          }

          if (matchedAccounts.length === 0) {
            Logger.error(
              '[BalanceService][getBalancesForAccounts] Could not map streamed balance to an account',
              {
                id,
                caip2Id: 'caip2Id' in balance ? balance.caip2Id : undefined,
                networkType:
                  'networkType' in balance ? balance.networkType : undefined
              }
            )
            continue
          }

          for (const account of matchedAccounts) {
            const normalized = mapBalanceResponseToLegacy(account, balance)
            if (!normalized) continue

            if (normalized.error) {
              // Mark chain as failed for retry
              failedChainIds.add(normalized.chainId)
            } else {
              // Progressive update callback for successful balance
              onBalanceLoaded?.(normalized)
            }

            finalResults[account.id]?.push(normalized)
          }
        }
      } catch (err) {
        balanceApiThrew = true
        Logger.error(
          '[BalanceService][getBalancesForAccounts] batch request failed',
          err
        )
        continue
      }
    }

    // Add filtered out chain IDs to failed chains for retry
    filteredOutChainIds.forEach(chainId => failedChainIds.add(chainId))

    // If the balance API threw, we want to retry for all networks.
    // Otherwise, we only retry failed networks.
    const networksToRetry = balanceApiThrew
      ? networks
      : networks.filter(n => failedChainIds.has(n.chainId))

    // Retry with vm modules
    if (networksToRetry.length > 0) {
      Logger.info(
        `[BalanceService][getBalancesForAccounts] retrying with vm modules for networks: ${networksToRetry
          .map(n => n.chainId)
          .join(', ')}`
      )

      const vmResults = await this.getVMBalancesForAccounts({
        networks: networksToRetry,
        accounts,
        currency,
        customTokens: {},
        onBalanceLoaded: (_chainId, partial) => {
          for (const accountId of Object.keys(partial)) {
            const balance = partial[accountId]
            if (balance) {
              onBalanceLoaded?.(balance)
            }
          }
        },
        xpAddressesByAccountId
      })

      // Merge VM results into final results
      for (const accountId of Object.keys(vmResults)) {
        const vmBalances = vmResults[accountId] ?? []
        const existingBalances = finalResults[accountId] ?? []

        // Replace failed balances with VM results
        for (const vmBalance of vmBalances) {
          const existingIndex = existingBalances.findIndex(
            b => b.chainId === vmBalance.chainId
          )
          if (existingIndex >= 0) {
            existingBalances[existingIndex] = vmBalance
          } else {
            existingBalances.push(vmBalance)
          }
        }

        finalResults[accountId] = existingBalances
      }
    }

    return finalResults
  }

  private async processBalanceBatches({
    requestBatches,
    account,
    currency,
    finalResults,
    onBalanceLoaded
  }: {
    requestBatches: GetBalancesRequestBody['data'][]
    account: Account
    currency: string
    finalResults: Map<number, AdjustedNormalizedBalancesForAccount>
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
  }): Promise<{ balanceApiThrew: boolean; failedChainIds: Set<number> }> {
    let balanceApiThrew = false
    const failedChainIds = new Set<number>()

    // Process each batch sequentially to avoid overwhelming the API
    for (const requestItems of requestBatches) {
      // Skip empty batches
      if (requestItems.length === 0) continue

      const body = {
        data: requestItems,
        currency: currency as GetBalancesRequestBody['currency'],
        showUntrustedTokens: true
      }

      try {
        for await (const balance of streamingBalanceApiClient.getBalances(
          body
        )) {
          const normalized = mapBalanceResponseToLegacy(account, balance)
          if (!normalized) continue

          if (normalized.error) {
            // Mark chain as failed
            failedChainIds.add(normalized.chainId)
          } else {
            // Progressive update callback for successful balance
            onBalanceLoaded?.(normalized)
          }

          // Add to final result (or update if already exists)
          finalResults.set(normalized.chainId, normalized)
        }
      } catch (err) {
        // Balance API down / request failed / stream broken for this batch
        balanceApiThrew = true
        Logger.error(
          `[BalanceService][getBalancesForAccount] batch request failed`,
          err
        )
        // Continue with next batch
      }
    }

    return { balanceApiThrew, failedChainIds }
  }

  private async getBalancesForAccountViaVmModules({
    networks,
    account,
    currency,
    onBalanceLoaded,
    xpAddresses
  }: {
    networks: Network[]
    account: Account
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
    xpAddresses: string[]
  }): Promise<AdjustedNormalizedBalancesForAccount[]> {
    if (networks.length === 0) return []

    const res = await this.getVMBalancesForAccounts({
      networks,
      accounts: [account],
      currency,
      customTokens: {},
      onBalanceLoaded: onBalanceLoaded
        ? (_chainId, partial) => {
            const balance = partial[account.id]
            if (balance) {
              onBalanceLoaded(balance)
            }
          }
        : undefined,
      xpAddressesByAccountId: new Map([[account.id, xpAddresses]])
    })

    return res[account.id] ?? []
  }

  private async filterNetworksBySupportedEvm(
    networks: Network[]
  ): Promise<{ networks: Network[]; filteredOutChainIds: number[] }> {
    const supported = await getSupportedChainsFromCache()
    if (!supported || supported.length === 0) {
      return { networks, filteredOutChainIds: [] }
    }

    const supportedEvmIds = new Set<number>()
    supported.forEach(caip2Id => {
      if (!caip2Id.startsWith('eip155:')) return
      const chainId = Number(caip2Id.split(':')[1])
      if (Number.isFinite(chainId)) {
        supportedEvmIds.add(chainId)
      }
    })

    if (supportedEvmIds.size === 0) {
      return { networks, filteredOutChainIds: [] }
    }

    const filteredOutChainIds: number[] = []
    const filteredNetworks: Network[] = []

    for (const network of networks) {
      if (network.vmName !== NetworkVMType.EVM) {
        filteredNetworks.push(network)
      } else if (supportedEvmIds.has(network.chainId)) {
        filteredNetworks.push(network)
      } else {
        filteredOutChainIds.push(network.chainId)
      }
    }

    return { networks: filteredNetworks, filteredOutChainIds }
  }
}

const getAddressesForAccountAndNetwork = ({
  account,
  network,
  xpAddresses
}: {
  account: Account
  network: Network
  xpAddresses: string[]
}): string[] => {
  if (isXPNetwork(network) && xpAddresses.length > 0) {
    const formatted = formatXpAddressesForNetwork(xpAddresses, network)
    if (formatted.length > 0) {
      return formatted
    }
  }

  const defaultAddress = getAddressByNetwork(account, network)
  return defaultAddress ? [defaultAddress] : []
}

const formatXpAddressesForNetwork = (
  xpAddresses: string[],
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
  xpAddresses.forEach(address => {
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

/**
 * Normalize an address for use as a map key.
 * EVM addresses are lowercased because EIP-55 checksumming is cosmetic —
 * the address identity is case-insensitive.  Other formats (base58 for
 * BTC/X/P-Chain, base58-checked for Solana) are case-sensitive and kept
 * as-is to avoid false collisions.
 *
 * @param isEvm – true when the address belongs to an EVM network
 */
const normalizeAddressKey = (address: string, isEvm: boolean): string =>
  isEvm ? address.toLowerCase() : address

export default new BalanceService()
