import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { AddressIndex } from '@avalabs/types'
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
import { balanceApi } from 'utils/apiClient/balance/balanceApi'
import { GetBalancesRequestBody } from 'utils/apiClient/generated/balanceApi.client'
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
import { AdjustedNormalizedBalancesForAccount } from './types'
import { buildRequestItemsForAccount } from './utils/buildRequestItemsForAccount'
import { getLocalTokenId } from './utils/getLocalTokenId'
import { mapBalanceResponseToLegacy } from './utils/mapBalanceResponseToLegacy'

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
  async getVMBalancesForAccounts({
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

    const requestBatches = buildRequestItemsForAccount(networks, account)

    const { balanceApiThrew, failedChainIds } =
      await this.processBalanceBatches({
        requestBatches,
        account,
        currency,
        finalResults,
        onBalanceLoaded
      })

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

          // Add to final result (or update if already exists)
          finalResults.set(normalized.chainId, normalized)
        }
      } catch (err) {
        // Balance API down / request failed / stream broken for this batch
        balanceApiThrew = true
        Logger.warn(
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
      onBalanceLoaded
    })

    return res[account.id] ?? []
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
    onBalanceLoaded
  }: {
    networks: Network[]
    accounts: Account[]
    currency: string
    onBalanceLoaded?: (balance: AdjustedNormalizedBalancesForAccount) => void
  }): Promise<Record<AccountId, AdjustedNormalizedBalancesForAccount[]>> {
    const finalResults: Record<
      AccountId,
      AdjustedNormalizedBalancesForAccount[]
    > = {}

    for (const account of accounts) {
      finalResults[account.id] = []
    }

    const accountById = accounts.reduce((acc, a) => {
      acc[a.id] = a
      return acc
    }, {} as Record<string, Account>)

    const accountByAddress = accounts.reduce((acc, account) => {
      const addresses = networks.flatMap(network =>
        getAddressesForAccountAndNetwork(account, network)
      )
      for (const address of addresses) {
        if (address) acc[address] = account
      }
      return acc
    }, {} as Record<string, Account>)

    const requestBatches = buildRequestItemsForAccounts(networks, accounts)

    for (const requestItems of requestBatches) {
      const body = {
        data: requestItems,
        currency: currency as GetBalancesRequestBody['currency'],
        showUntrustedTokens: true
      }

      for await (const balance of balanceApi.getBalancesStream(body)) {
        const id = 'id' in balance ? balance.id : undefined
        const account =
          (id ? accountById[id] : undefined) ??
          (id ? accountByAddress[id] : undefined) ??
          (accounts.length === 1 ? accounts[0] : undefined)

        if (!account) {
          Logger.warn(
            '[BalanceService][getBalancesForAccountsV2] Could not map streamed balance to an account',
            {
              id,
              caip2Id: 'caip2Id' in balance ? balance.caip2Id : undefined,
              networkType:
                'networkType' in balance ? balance.networkType : undefined
            }
          )
          continue
        }

        const normalized = mapBalanceResponseToLegacy(account, balance)
        if (!normalized) continue

        onBalanceLoaded?.(normalized)
        finalResults[account.id]?.push(normalized)
      }
    }

    return finalResults
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

const uniq = <T>(arr: ReadonlyArray<T>): T[] => Array.from(new Set(arr))

type BalanceRequestItem = GetBalancesRequestBody['data'][number]

type NonAvaxRequestItem = Exclude<BalanceRequestItem, { namespace: 'avax' }>
type AvaxRequestItem = Extract<BalanceRequestItem, { namespace: 'avax' }>
type EvmRequestItem = Extract<BalanceRequestItem, { namespace: 'eip155' }>

/**
 * Keep in sync with `buildRequestItemsForAccount` constraints.
 */
const MAX_EVM_REFERENCES = 20
const MAX_NAMESPACES_PER_BATCH = 5

type CorethAvaxItem = Extract<
  AvaxRequestItem,
  {
    references: Array<
      '8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a' | 'YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd'
    >
  }
>
type XpAvaxItem = Exclude<AvaxRequestItem, CorethAvaxItem>

const CORETH_REFS = new Set([
  '8aDU0Kqh-5d23op-B-r-4YbQFRbsgF9a',
  'YRLfeDBJpfEqUWe2FYR1OpXsnDDZeKWd'
])

const isCorethRef = (ref: AvaxRequestItem['references'][number]): boolean =>
  CORETH_REFS.has(ref)

const isCorethAvaxItem = (item: AvaxRequestItem): item is CorethAvaxItem =>
  item.references.every(isCorethRef)

const getAvaxBucketKey = (item: AvaxRequestItem): string => {
  const kind = isCorethAvaxItem(item) ? 'coreth' : 'xp'
  const refs = uniq(item.references).slice().sort().join('|')
  return `${kind}:${refs}`
}

const mergeNonAvaxItem = (
  acc: NonAvaxRequestItem[],
  item: NonAvaxRequestItem
): void => {
  const existing = acc.find(i => i.namespace === item.namespace)
  if (!existing) {
    // Keep literal reference types intact by narrowing on the discriminant.
    if (item.namespace === 'bip122') {
      acc.push({
        ...item,
        addresses: uniq(item.addresses),
        references: uniq(item.references)
      })
      return
    }
    if (item.namespace === 'solana') {
      acc.push({
        ...item,
        addresses: uniq(item.addresses),
        references: uniq(item.references)
      })
      return
    }
    acc.push({
      ...item,
      addresses: uniq(item.addresses),
      references: uniq(item.references)
    })
    return
  }

  existing.addresses = uniq([...existing.addresses, ...item.addresses])
  existing.references = uniq([...existing.references, ...item.references])
}

type AvaxEntry =
  | { key: string; kind: 'coreth'; item: CorethAvaxItem }
  | { key: string; kind: 'xp'; item: XpAvaxItem }

const mergeAddressDetails = (
  existing: { addressDetails?: Array<{ id: string; addresses: string[] }> },
  incoming: { addressDetails?: Array<{ id: string; addresses: string[] }> }
): void => {
  const existingDetails = existing.addressDetails ?? []
  const incomingDetails = incoming.addressDetails ?? []

  for (const next of incomingDetails) {
    const found = existingDetails.find(d => d.id === next.id)
    if (!found) {
      existingDetails.push({ ...next, addresses: uniq(next.addresses) })
    } else {
      found.addresses = uniq([...found.addresses, ...next.addresses])
    }
  }

  existing.addressDetails = existingDetails
}

const mergeAvaxItem = (acc: AvaxEntry[], item: AvaxRequestItem): void => {
  const key = getAvaxBucketKey(item)

  if (isCorethAvaxItem(item)) {
    const existing = acc.find(e => e.key === key && e.kind === 'coreth') as
      | AvaxEntry
      | undefined

    if (!existing || existing.kind !== 'coreth') {
      acc.push({
        key,
        kind: 'coreth',
        item: {
          ...item,
          references: uniq(item.references),
          addressDetails: item.addressDetails?.map(d => ({
            ...d,
            addresses: uniq(d.addresses)
          }))
        }
      })
      return
    }

    existing.item.references = uniq([
      ...existing.item.references,
      ...item.references
    ])
    mergeAddressDetails(existing.item, item)
    if (existing.item.filterOutDustUtxos === false) return
    if (item.filterOutDustUtxos === false) {
      existing.item.filterOutDustUtxos = false
    }
    return
  }

  const xpItem = item as XpAvaxItem
  const existing = acc.find(e => e.key === key && e.kind === 'xp') as
    | AvaxEntry
    | undefined

  if (!existing || existing.kind !== 'xp') {
    acc.push({
      key,
      kind: 'xp',
      item: {
        ...xpItem,
        references: uniq(xpItem.references),
        addressDetails: xpItem.addressDetails?.map(d => ({
          ...d,
          addresses: uniq(d.addresses)
        }))
      }
    })
    return
  }

  existing.item.references = uniq([
    ...existing.item.references,
    ...xpItem.references
  ])
  mergeAddressDetails(existing.item, xpItem)
  if (existing.item.filterOutDustUtxos === false) return
  if (xpItem.filterOutDustUtxos === false) {
    existing.item.filterOutDustUtxos = false
  }
}

type BuildAccountsMergeState = {
  nonEvmNonAvax: NonAvaxRequestItem[]
  avax: AvaxEntry[]
  evm?: EvmRequestItem
}

const mergeEvmItem = (
  state: Pick<BuildAccountsMergeState, 'evm'>,
  item: EvmRequestItem
): void => {
  if (!state.evm) {
    state.evm = {
      ...item,
      addresses: uniq(item.addresses),
      references: uniq(item.references)
    }
    return
  }

  state.evm.addresses = uniq([...state.evm.addresses, ...item.addresses])
  state.evm.references = uniq([...state.evm.references, ...item.references])
}

const splitEvmReferences = (evm?: EvmRequestItem): EvmRequestItem[] => {
  if (!evm) return []

  const addresses = uniq(evm.addresses)
  const references = uniq(evm.references)

  if (references.length <= MAX_EVM_REFERENCES) {
    return [{ ...evm, addresses, references }]
  }

  const items: EvmRequestItem[] = []
  for (let i = 0; i < references.length; i += MAX_EVM_REFERENCES) {
    const chunk = references.slice(i, i + MAX_EVM_REFERENCES)
    items.push({
      namespace: 'eip155',
      addresses,
      references: chunk
    })
  }
  return items
}

const packIntoBatches = (
  items: GetBalancesRequestBody['data']
): GetBalancesRequestBody['data'][] => {
  const batches: GetBalancesRequestBody['data'][] = []
  for (let i = 0; i < items.length; i += MAX_NAMESPACES_PER_BATCH) {
    batches.push(items.slice(i, i + MAX_NAMESPACES_PER_BATCH))
  }
  return batches.length === 0 ? [[]] : batches
}

/**
 * Builds and merges request items for multiple accounts. This avoids sending
 * duplicate namespace buckets (EVM/BTC/SVM) and merges `avax.addressDetails`
 * by `id` while keeping Coreth vs XP reference sets separate.
 */
const buildRequestItemsForAccounts = (
  networks: Network[],
  accounts: Account[]
): GetBalancesRequestBody['data'][] => {
  const state: BuildAccountsMergeState = {
    nonEvmNonAvax: [],
    avax: []
  }

  for (const account of accounts) {
    const batches = buildRequestItemsForAccount(networks, account)
    for (const batch of batches) {
      for (const item of batch) {
        if (item.namespace === 'avax') {
          mergeAvaxItem(state.avax, item)
        } else if (item.namespace === 'eip155') {
          mergeEvmItem(state, item)
        } else {
          mergeNonAvaxItem(state.nonEvmNonAvax, item as NonAvaxRequestItem)
        }
      }
    }
  }

  const merged: GetBalancesRequestBody['data'] = [
    ...state.nonEvmNonAvax,
    ...splitEvmReferences(state.evm),
    ...state.avax.map(e => e.item)
  ]

  return packIntoBatches(merged)
}
