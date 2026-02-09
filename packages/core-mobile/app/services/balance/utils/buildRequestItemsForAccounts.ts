import {
  AvalancheCaip2ChainId,
  BitcoinCaip2ChainId,
  BlockchainNamespace,
  Network,
  SolanaCaip2ChainId
} from '@avalabs/core-chains-sdk'
import { Account } from 'store/account/types'
import { getAddressByNetwork } from 'store/account/utils'
import { NetworkVMType } from '@avalabs/core-chains-sdk'
import {
  AvalancheXpGetBalancesRequestItem,
  BtcGetBalancesRequestItem,
  EvmGetBalancesRequestItem,
  GetBalancesRequestBody,
  SvmGetBalancesRequestItem
} from 'utils/apiClient/generated/balanceApi.client'

/**
 * Maximum number of EVM references allowed per request item
 */
const MAX_EVM_REFERENCES = 20

/**
 * Maximum number of namespaces allowed per request batch
 */
const MAX_NAMESPACES_PER_BATCH = 5

/**
 * Maximum number of addresses allowed per request item
 */
const MAX_ADDRESSES_PER_ITEM = 50

/**
 * Maximum number of addressDetails entries allowed per AVAX request item
 */
const MAX_ADDRESS_DETAILS_PER_ITEM = 50

/**
 * Extracts the reference part from a CAIP-2 chain ID.
 * CAIP-2 format: namespace:reference
 * Example: "bip122:000000000019d6689c085ae165831e93" -> "000000000019d6689c085ae165831e93"
 */
const extractCaip2Reference = (caip2Id: string): string => {
  const parts = caip2Id.split(':')
  return parts[1] ?? caip2Id // Fallback to original if no colon found
}

/**
 * Builds one or more `data` arrays for balance requests by grouping all networks
 * across multiple accounts into the correct namespace buckets (EVM, BTC, SVM, AVAX).
 *
 * Multiple networks of the same VM type are collapsed into one or more request items,
 * collecting all unique addresses and chain references needed by the Balance API.
 *
 * Limits enforced:
 * - EVM references per item: 20
 * - Addresses per item (all namespaces): 50
 * - AddressDetails entries per AVAX item: 50
 * - Namespaces per batch: 5
 *
 * Empty arrays are never emitted in request items.
 *
 * @param xpubByAccountId - Map of account IDs to their Avalanche extended public keys (xpub).
 *                          When provided, the account will use extendedPublicKeyDetails
 *                          instead of addressDetails for more efficient balance queries.
 *
 * @returns An array of request batches. Each batch is a complete `data` array
 *          that can be sent as a separate request.
 */
export const buildRequestItemsForAccounts = ({
  networks,
  accounts,
  xpAddressesByAccountId,
  xpubByAccountId
}: {
  networks: Network[]
  accounts: Account[]
  xpAddressesByAccountId: Map<string, string[]>
  xpubByAccountId: Map<string, string | undefined>
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): GetBalancesRequestBody['data'][] => {
  const evmReferences = new Set<string>()
  const btcReferences = new Set<string>()
  const svmReferences = new Set<string>()
  const avaxReferences = new Set<string>()

  const evmAddresses = new Set<string>()
  const btcAddresses = new Set<string>()
  const svmAddresses = new Set<string>()

  // --- Collect references ------------------------------------------------------
  for (const network of networks) {
    switch (network.vmName) {
      case NetworkVMType.EVM:
        evmReferences.add(String(network.chainId))
        break
      case NetworkVMType.BITCOIN:
        btcReferences.add(
          network.isTestnet
            ? extractCaip2Reference(BitcoinCaip2ChainId.TESTNET)
            : extractCaip2Reference(BitcoinCaip2ChainId.MAINNET)
        )
        break
      case NetworkVMType.SVM:
        svmReferences.add(
          network.isTestnet
            ? extractCaip2Reference(SolanaCaip2ChainId.DEVNET)
            : extractCaip2Reference(SolanaCaip2ChainId.MAINNET)
        )
        break
      case NetworkVMType.AVM:
      case NetworkVMType.PVM: {
        const ref =
          network.vmName === NetworkVMType.PVM
            ? network.isTestnet
              ? extractCaip2Reference(AvalancheCaip2ChainId.P_TESTNET)
              : extractCaip2Reference(AvalancheCaip2ChainId.P)
            : network.isTestnet
            ? extractCaip2Reference(AvalancheCaip2ChainId.X_TESTNET)
            : extractCaip2Reference(AvalancheCaip2ChainId.X)
        avaxReferences.add(ref)
        break
      }
      default:
        break
    }
  }

  // --- Collect addresses for non-AVAX namespaces ------------------------------
  for (const account of accounts) {
    for (const network of networks) {
      const address = getAddressByNetwork(account, network)
      if (typeof address !== 'string' || address.trim() === '') {
        continue
      }
      switch (network.vmName) {
        case NetworkVMType.EVM:
          evmAddresses.add(address)
          break
        case NetworkVMType.BITCOIN:
          btcAddresses.add(address)
          break
        case NetworkVMType.SVM:
          svmAddresses.add(address)
          break
        default:
          break
      }
    }
  }

  // --- Build AVAX addressDetails and extendedPublicKeyDetails ----------------
  const avaxAddressDetails: AvalancheXpGetBalancesRequestItem['addressDetails'] =
    []
  const avaxExtendedPublicKeyDetails: AvalancheXpGetBalancesRequestItem['extendedPublicKeyDetails'] =
    []

  if (avaxReferences.size > 0) {
    for (const account of accounts) {
      const xpub = xpubByAccountId.get(account.id)

      // If account has xpub, use extendedPublicKeyDetails (more efficient)
      if (xpub) {
        avaxExtendedPublicKeyDetails.push({
          id: account.id,
          extendedPublicKey: xpub
        })
      } else {
        // Otherwise, use addressDetails with individual addresses
        const xpAddresses = xpAddressesByAccountId?.get(account.id)

        if (!xpAddresses || xpAddresses.length === 0) continue

        const addressChunks = chunkArray(xpAddresses, MAX_ADDRESSES_PER_ITEM)
        for (const chunk of addressChunks) {
          avaxAddressDetails.push({
            id: account.id,
            addresses: chunk
          })
        }
      }
    }
  }

  // ---- Build request items ----------------------------------------------------
  const evmItems: EvmGetBalancesRequestItem[] = []
  const evmRefs = Array.from(evmReferences)
  const evmAddrs = Array.from(evmAddresses)

  if (evmRefs.length > 0 && evmAddrs.length > 0) {
    const refChunks = chunkArray(evmRefs, MAX_EVM_REFERENCES)
    const addressChunks = chunkArray(evmAddrs, MAX_ADDRESSES_PER_ITEM)
    for (const refChunk of refChunks) {
      for (const addressChunk of addressChunks) {
        if (refChunk.length === 0 || addressChunk.length === 0) continue
        evmItems.push({
          namespace: BlockchainNamespace.EIP155,
          addresses: addressChunk,
          references: refChunk
        })
      }
    }
  }

  const btcItems: BtcGetBalancesRequestItem[] = []
  const btcRefs = Array.from(
    btcReferences
  ) as BtcGetBalancesRequestItem['references']
  const btcAddrs = Array.from(btcAddresses)
  if (btcRefs.length > 0 && btcAddrs.length > 0) {
    const addressChunks = chunkArray(btcAddrs, MAX_ADDRESSES_PER_ITEM)
    for (const addressChunk of addressChunks) {
      if (addressChunk.length === 0) continue
      btcItems.push({
        namespace: BlockchainNamespace.BIP122,
        addresses: addressChunk,
        references: btcRefs
      })
    }
  }

  const svmItems: SvmGetBalancesRequestItem[] = []
  const svmRefs = Array.from(
    svmReferences
  ) as SvmGetBalancesRequestItem['references']
  const svmAddrs = Array.from(svmAddresses)
  if (svmRefs.length > 0 && svmAddrs.length > 0) {
    const addressChunks = chunkArray(svmAddrs, MAX_ADDRESSES_PER_ITEM)
    for (const addressChunk of addressChunks) {
      if (addressChunk.length === 0) continue
      svmItems.push({
        namespace: BlockchainNamespace.SOLANA,
        addresses: addressChunk,
        references: svmRefs
      })
    }
  }

  const avaxItems: AvalancheXpGetBalancesRequestItem[] = []
  const avaxRefs = Array.from(
    avaxReferences
  ) as AvalancheXpGetBalancesRequestItem['references']

  // Build AVAX items if we have any references and at least one of addressDetails or extendedPublicKeyDetails
  if (
    avaxRefs.length > 0 &&
    (avaxAddressDetails.length > 0 || avaxExtendedPublicKeyDetails.length > 0)
  ) {
    // Chunk addressDetails (max 50 per item)
    const addressDetailChunks = chunkArray(
      avaxAddressDetails,
      MAX_ADDRESS_DETAILS_PER_ITEM
    )

    // Chunk extendedPublicKeyDetails (max 50 per item)
    const xpubDetailChunks = chunkArray(
      avaxExtendedPublicKeyDetails,
      MAX_ADDRESS_DETAILS_PER_ITEM
    )

    // If we have both types, we need to create items that may contain both
    // For simplicity, we'll create separate chunks for each type
    const maxChunks = Math.max(
      addressDetailChunks.length,
      xpubDetailChunks.length
    )

    for (let i = 0; i < maxChunks; i++) {
      const addressChunk = addressDetailChunks[i] || []
      const xpubChunk = xpubDetailChunks[i] || []

      // Skip if both chunks are empty
      if (addressChunk.length === 0 && xpubChunk.length === 0) continue

      const item: AvalancheXpGetBalancesRequestItem = {
        namespace: BlockchainNamespace.AVAX,
        references: avaxRefs,
        filterOutDustUtxos: false
      }

      // Add addressDetails if present
      if (addressChunk.length > 0) {
        item.addressDetails = addressChunk
      }

      // Add extendedPublicKeyDetails if present
      if (xpubChunk.length > 0) {
        item.extendedPublicKeyDetails = xpubChunk
      }

      avaxItems.push(item)
    }
  }

  // Strategy: Combine all items (non-EVM first, then EVM), then pack into batches
  const allItems: GetBalancesRequestBody['data'] = [
    ...btcItems,
    ...svmItems,
    ...avaxItems,
    ...evmItems
  ]

  // Pack items into batches of max 5
  const finalBatches: GetBalancesRequestBody['data'][] = []
  for (let i = 0; i < allItems.length; i += MAX_NAMESPACES_PER_BATCH) {
    const chunk = allItems.slice(i, i + MAX_NAMESPACES_PER_BATCH)
    if (chunk.length > 0) {
      finalBatches.push(chunk)
    }
  }

  return finalBatches
}

const chunkArray = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) return []
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    const chunk = arr.slice(i, i + size)
    if (chunk.length > 0) {
      chunks.push(chunk)
    }
  }
  return chunks
}
