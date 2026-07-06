import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace,
  ChainId,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { AVALANCHE_MAINNET_NETWORK } from 'services/network/consts'
import { defaultEnabledL2ChainIds } from 'services/network/consts'
import { streamingBalanceApiClient } from 'utils/api/clients/balanceApiClient'
import {
  AvalancheXpGetBalancesRequestItem,
  BtcGetBalancesRequestItem,
  EvmGetBalancesRequestItem,
  GetBalancesRequestBody,
  GetBalancesResponse,
  SvmGetBalancesRequestItem
} from 'utils/api/generated/balanceApi.client'
import ModuleManager from 'vmModule/ModuleManager'
import { mapToVmNetwork } from 'vmModule/utils/mapToVmNetwork'
import Logger from 'utils/Logger'

const DISCOVERY_BALANCE_CURRENCY = 'usd'

/**
 * Represents the derived address data for a single Ledger account index.
 */
export interface LedgerDerivedAccount {
  /** BIP-44 account index */
  index: number
  /** EVM (C-Chain / Ethereum) address */
  addressC: string
  /** Bitcoin address */
  addressBTC: string
  /** X/P-chain extended public key (xpub) */
  xpubXP: string
  /** Solana address (optional — not all Ledger devices support it) */
  addressSVM?: string
}

/**
 * Extracts the reference portion from a CAIP-2 chain ID.
 * E.g. "eip155:43114" -> "43114"
 */
const extractCaip2Reference = (caip2Id: string): string => {
  const parts = caip2Id.split(':')
  return parts[1] ?? caip2Id
}

/**
 * Returns true when a balance string represents a positive amount.
 */
const isPositiveBalance = (value: string | undefined): boolean => {
  if (!value) {
    return false
  }

  try {
    return BigInt(value) > 0n
  } catch {
    return false
  }
}

/**
 * Inspects a Balance API response to determine if it contains any on-chain activity.
 * This is a self-contained replica of the helper in AccountsService to keep the
 * discovery module free of circular imports.
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const hasBalanceActivity = (response: GetBalancesResponse): boolean => {
  if (!('networkType' in response) || ('error' in response && response.error)) {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balances = response.balances as any
  if (!balances) {
    return false
  }

  switch (response.networkType) {
    case 'evm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (balances.erc20TokenBalances ?? []).some(
          (token: { balance?: string }) => isPositiveBalance(token.balance)
        )
      )

    case 'btc':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        isPositiveBalance(balances.nativeTokenBalance?.unconfirmedBalance)
      )

    case 'svm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (balances.splTokenBalances ?? []).some((token: { balance?: string }) =>
          isPositiveBalance(token.balance)
        )
      )

    case 'avm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        [
          ...(balances.categories?.unlocked ?? []),
          ...(balances.categories?.locked ?? []),
          ...Object.values(
            balances.categories?.atomicMemoryUnlocked ?? {}
          ).flat(),
          ...Object.values(balances.categories?.atomicMemoryLocked ?? {}).flat()
        ].some((asset: { balance?: string }) =>
          isPositiveBalance(asset.balance)
        )
      )

    case 'pvm':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        [
          balances.categories?.unlockedStaked,
          balances.categories?.unlockedUnstaked,
          balances.categories?.unlockedUnstakedMultiSig,
          balances.categories?.lockedStaked,
          balances.categories?.lockedPlatform,
          balances.categories?.lockedStakeable,
          ...Object.values(balances.categories?.atomicMemoryLocked ?? {}),
          ...Object.values(balances.categories?.atomicMemoryUnlocked ?? {})
        ].some(isPositiveBalance)
      )

    case 'coreth':
      return (
        isPositiveBalance(balances.nativeTokenBalance?.balance) ||
        (
          [
            ...Object.values(
              balances.categories?.atomicMemoryUnlocked ?? {}
            ).flat(),
            ...Object.values(
              balances.categories?.atomicMemoryLocked ?? {}
            ).flat()
          ] as Array<{ balance?: string }>
        ).some(asset => isPositiveBalance(asset.balance))
      )

    default:
      return false
  }
}

/**
 * Builds the Balance API request items for a set of derived Ledger accounts.
 * Groups addresses by chain type (EVM, BTC, AVAX xpub, SVM) and constructs
 * the appropriate request shapes.
 *
 * For EVM, BTC, and SVM the `id` returned in responses is the address itself.
 * For AVAX X/P chains we use xpub-based lookup with `ledger-{index}` as the ID
 * so we can correlate responses back to account indices.
 */
export const buildLedgerBalanceRequestItems = (
  accounts: LedgerDerivedAccount[]
): GetBalancesRequestBody['data'] => {
  const evmAddresses: string[] = []
  const btcAddresses: string[] = []
  const svmAddresses: string[] = []
  const avaxXpubDetails: Array<{ id: string; extendedPublicKey: string }> = []

  for (const account of accounts) {
    if (account.addressC) {
      evmAddresses.push(account.addressC)
    }

    if (account.addressBTC) {
      btcAddresses.push(account.addressBTC)
    }

    if (account.addressSVM) {
      svmAddresses.push(account.addressSVM)
    }

    if (account.xpubXP) {
      avaxXpubDetails.push({
        id: `ledger-${account.index}`,
        extendedPublicKey: account.xpubXP
      })
    }
  }

  const requestItems: GetBalancesRequestBody['data'] = []

  if (evmAddresses.length > 0) {
    requestItems.push({
      namespace: BlockchainNamespace.EIP155,
      addresses: evmAddresses,
      references: [
        String(ChainId.AVALANCHE_MAINNET_ID),
        String(ChainId.ETHEREUM_HOMESTEAD),
        ...defaultEnabledL2ChainIds.map(String)
      ]
    } as EvmGetBalancesRequestItem)
  }

  if (btcAddresses.length > 0) {
    requestItems.push({
      namespace: BlockchainNamespace.BIP122,
      addresses: btcAddresses,
      references: [extractCaip2Reference(BitcoinCaip2ChainId.MAINNET)]
    } as BtcGetBalancesRequestItem)
  }

  if (avaxXpubDetails.length > 0) {
    requestItems.push({
      namespace: BlockchainNamespace.AVAX,
      references: [
        extractCaip2Reference(AvalancheCaip2ChainId.X),
        extractCaip2Reference(AvalancheCaip2ChainId.P)
      ],
      filterOutDustUtxos: false,
      extendedPublicKeyDetails: avaxXpubDetails
    } as AvalancheXpGetBalancesRequestItem)
  }

  if (svmAddresses.length > 0) {
    requestItems.push({
      namespace: BlockchainNamespace.SOLANA,
      addresses: svmAddresses,
      references: [extractCaip2Reference(SolanaCaip2ChainId.MAINNET)]
    } as SvmGetBalancesRequestItem)
  }

  return requestItems
}

/**
 * Constructs the batch request items for querying Ledger-derived accounts' balances
 * across multiple supported blockchains (EVM, Bitcoin, Avalanche, Solana).
 *
 * For each type of supported address found in the provided accounts, appropriate
 * request items are prepared, following the namespace conventions:
 *
 * - EIP155 for EVM-based chains (using addresses from `addressC`)
 * - BIP122 for Bitcoin (using addresses from `addressBTC`)
 * - AVAX for Avalanche X/P chains (using `xpubXP`)
 * - SOLANA for Solana (using addresses from `addressSVM`)
 *
 * Returns an array of request items compatible with the multi-chain balance query API.
 *
 * @param accounts - The array of LedgerDerivedAccount objects
 * @returns Array of balance request items for all discovered addresses/xpubs
 */
const buildIdToIndexMap = (
  accounts: LedgerDerivedAccount[]
): Map<string, number> => {
  const idToIndex = new Map<string, number>()
  for (const account of accounts) {
    if (account.addressC) {
      idToIndex.set(account.addressC.toLowerCase(), account.index)
    }
    if (account.addressBTC) {
      idToIndex.set(account.addressBTC, account.index)
    }
    if (account.addressSVM) {
      idToIndex.set(account.addressSVM, account.index)
    }
    if (account.xpubXP) {
      idToIndex.set(`ledger-${account.index}`, account.index)
    }
  }
  return idToIndex
}

const setActiveIndicesByActiveBalanceResponse = async (
  activeIndicesSet: Set<number>,
  requestItems: GetBalancesRequestBody['data'],
  idToIndex: Map<string, number>
): Promise<Set<number>> => {
  try {
    for await (const response of streamingBalanceApiClient.getBalances({
      data: requestItems,
      currency: DISCOVERY_BALANCE_CURRENCY
    })) {
      // If the response does not have activity, skip it
      if (!hasBalanceActivity(response)) {
        continue
      }

      const responseId = 'id' in response ? response.id : undefined
      // If the response does not have an ID, skip it
      if (!responseId) {
        continue
      }

      // For EVM responses the ID is the address — match case-insensitively
      const isEvm = 'networkType' in response && response.networkType === 'evm'
      const normalizedId = isEvm ? responseId.toLowerCase() : responseId

      const index = idToIndex.get(normalizedId)
      if (index !== undefined) {
        activeIndicesSet.add(index)
      }
    }
  } catch (error) {
    Logger.error(
      'Failed to check Ledger account activity via Balance API',
      error
    )
  }

  return activeIndicesSet
}

/**
 * Checks which Ledger account indices have on-chain activity by querying the
 * streaming Balance API in a single batch request.
 *
 * The returned array is a sorted list of contiguous indices that should be
 * imported:
 * - Index 0 is always included (the primary account).
 * - Gaps between active indices are filled (e.g. if 0 and 3 are active,
 *   returns [0, 1, 2, 3]).
 * - Trailing inactive indices are trimmed.
 * - On API failure the function falls back to [0].
 */
export const getActiveAccountIndices = async (
  accounts: LedgerDerivedAccount[]
): Promise<number[]> => {
  if (accounts.length === 0) {
    return [0]
  }

  const requestItems = buildLedgerBalanceRequestItems(accounts)

  if (requestItems.length === 0) {
    return [0]
  }

  // Build reverse-lookup maps so we can match response IDs back to indices.
  // EVM responses use the address (lowercased) as the ID.
  // BTC/SVM responses use the address as the ID.
  // AVAX xpub responses use the `ledger-{index}` ID we supplied.
  const idToIndex = buildIdToIndexMap(accounts)

  const activeIndicesSet = new Set<number>()

  await setActiveIndicesByActiveBalanceResponse(
    activeIndicesSet,
    requestItems,
    idToIndex
  )

  // For EVM addresses not detected by balance, check C-Chain transaction history
  // concurrently. This catches accounts that had past activity but now have zero balance.
  try {
    const inactiveEvmAccounts = accounts.filter(
      a => a.addressC && !activeIndicesSet.has(a.index)
    )

    if (inactiveEvmAccounts.length > 0) {
      await ModuleManager.init()
      const evmModule = await ModuleManager.loadModuleByNetwork(
        AVALANCHE_MAINNET_NETWORK
      )
      const evmNetwork = mapToVmNetwork(AVALANCHE_MAINNET_NETWORK)

      const results = await Promise.allSettled(
        inactiveEvmAccounts.map(async account => {
          const response = await evmModule.getTransactionHistory({
            network: evmNetwork,
            address: account.addressC,
            offset: 1
          })
          return {
            index: account.index,
            hasActivity: response.transactions.length > 0
          }
        })
      )

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value.hasActivity) {
          activeIndicesSet.add(result.value.index)
        }
      }
    }
  } catch (error) {
    Logger.error(
      'Failed to check C-Chain transaction history during discovery',
      error
    )
  }

  // Always include index 0
  activeIndicesSet.add(0)

  // Fill gaps up to the highest active index so we get a contiguous range.
  const maxActive = Math.max(...activeIndicesSet)
  const result: number[] = []
  for (let i = 0; i <= maxActive; i++) {
    result.push(i)
  }

  return result
}
