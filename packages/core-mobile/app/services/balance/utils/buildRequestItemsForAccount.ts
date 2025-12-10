import { BlockchainNamespace, Network } from '@avalabs/core-chains-sdk'
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
import { stripAddressPrefix } from 'common/utils/stripAddressPrefix'

const uniq = <T>(arr: T[]): T[] => Array.from(new Set(arr))

/**
 * Builds the `data` array for a balance request by grouping all networks for a
 * single account into the correct namespace buckets (EVM, BTC, SVM, AVAX).
 *
 * Multiple networks of the same VM type are collapsed into one request item,
 * collecting all unique addresses and chain references needed by the Balance API.
 *
 * Example:
 *   Networks: C-Chain (43114), ETH (1), BTC, X-Chain, P-Chain
 *   Output request items:
 *     [
 *       { namespace: 'eip155', addresses: [...], references: ['43114','1'] },
 *       { namespace: 'bip122', addresses: [...], references: ['00000000...'] },
 *       {
 *         namespace: 'avax',
 *         references: ['imji8pap...', 'Rr9hnPVP...'],
 *         addressDetails: [{ id: '<accountId>', addresses: [...] }]
 *       }
 *     ]
 */
export const buildRequestItemsForAccount = (
  networks: Network[],
  account: Account
  // eslint-disable-next-line sonarjs/cognitive-complexity
): GetBalancesRequestBody['data'] => {
  const accountId = account.id
  const accountXpAddresses = getAccountXpAddresses(account)

  // Namespace buckets
  let evmBucket: EvmGetBalancesRequestItem | undefined
  let btcBucket: BtcGetBalancesRequestItem | undefined
  let svmBucket: SvmGetBalancesRequestItem | undefined

  const avaxXpBucket: {
    references: AvalancheXpGetBalancesRequestItem['references']
    addresses: string[]
  } = {
    references: [],
    addresses: []
  }

  // --- Fill buckets -----------------------------------------------------------
  for (const network of networks) {
    const address = getAddressByNetwork(account, network)

    // Skip networks where address is null, undefined, or empty/whitespace string
    if (typeof address !== 'string' || address.trim() === '') {
      continue
    }

    switch (network.vmName) {
      case NetworkVMType.EVM: {
        const ref = String(network.chainId)
        if (!evmBucket) {
          evmBucket = {
            namespace: BlockchainNamespace.EIP155,
            addresses: [address],
            references: [ref]
          }
        } else {
          evmBucket.addresses = uniq([...evmBucket.addresses, address])
          evmBucket.references = uniq([...evmBucket.references, ref])
        }
        break
      }

      case NetworkVMType.BITCOIN: {
        const ref = network.isTestnet
          ? '000000000933ea01ad0ee984209779ba'
          : '000000000019d6689c085ae165831e93'

        if (!btcBucket) {
          btcBucket = {
            namespace: BlockchainNamespace.BIP122,
            addresses: [address],
            references: [ref]
          }
        } else {
          btcBucket.addresses = uniq([...btcBucket.addresses, address])
          btcBucket.references = uniq([...btcBucket.references, ref])
        }
        break
      }

      case NetworkVMType.SVM: {
        const ref = network.isTestnet
          ? 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
          : '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'

        if (!svmBucket) {
          svmBucket = {
            namespace: BlockchainNamespace.SOLANA,
            addresses: [address],
            references: [ref]
          }
        } else {
          svmBucket.addresses = uniq([...svmBucket.addresses, address])
          svmBucket.references = uniq([...svmBucket.references, ref])
        }
        break
      }

      case NetworkVMType.AVM:
      case NetworkVMType.PVM: {
        const ref =
          network.vmName === NetworkVMType.PVM
            ? network.isTestnet
              ? 'Sj7NVE3jXTbJvwFAiu7OEUo_8g8ctXMG'
              : 'Rr9hnPVPxuUvrdCul-vjEsU1zmqKqRDo'
            : network.isTestnet
            ? '8AJTpRj3SAqv1e80Mtl9em08LhvKEbkl'
            : 'imji8papUf2EhV3le337w1vgFauqkJg-'

        avaxXpBucket.references = uniq([...avaxXpBucket.references, ref])
        avaxXpBucket.addresses = uniq([
          ...avaxXpBucket.addresses,
          ...accountXpAddresses
        ])
        break
      }

      default:
        break
    }
  }

  // ---- Build final requestItems array ----------------------------------------
  const requestItems: GetBalancesRequestBody['data'] = []

  // Early check already filters invalid addresses, so buckets are safe to add
  if (evmBucket) requestItems.push(evmBucket)
  if (btcBucket) requestItems.push(btcBucket)
  if (svmBucket) requestItems.push(svmBucket)

  // Filter out empty addresses from AVAX bucket (stripAddressPrefix can return empty)
  const validAvaxAddresses = avaxXpBucket.addresses.filter(
    addr => typeof addr === 'string' && addr.trim() !== ''
  )
  if (validAvaxAddresses.length > 0 && avaxXpBucket.references.length > 0) {
    requestItems.push({
      namespace: BlockchainNamespace.AVAX,
      references: avaxXpBucket.references,
      addressDetails: [
        {
          id: accountId,
          addresses: validAvaxAddresses
        }
      ],
      filterOutDustUtxos: false
    })
  }

  return requestItems
}

const getAccountXpAddresses = (account: Account): string[] => {
  const derivedXpAddresses =
    account.xpAddresses?.map(({ address }) => stripAddressPrefix(address)) ?? []

  if (derivedXpAddresses.length > 0) {
    return uniq(derivedXpAddresses)
  }

  const fallbackAddress = account.addressAVM || account.addressPVM
  return fallbackAddress ? [stripAddressPrefix(fallbackAddress)] : []
}
