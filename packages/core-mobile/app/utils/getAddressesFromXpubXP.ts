import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import {
  WalletType,
  NetworkAddresses,
  NormalizedXPAddresses
} from 'services/wallet/types'
import { xpAddressWithoutPrefix } from 'new/common/utils/xpAddressWIthoutPrefix'
import ProfileService from 'services/profile/ProfileService'

const isResponseLonger = (
  response1: NetworkAddresses,
  response2: NetworkAddresses
): boolean => {
  return response1.externalAddresses.length > response2.externalAddresses.length
}

/**
 * Merges P-Chain and X-Chain addresses and removes duplicates.
 *
 * Since P-Chain and X-Chain use the same underlying addresses (just different prefixes),
 * we merge them and deduplicate based on the address string without prefix.
 *
 * @param pAddresses - P-Chain addresses
 * @param xAddresses - X-Chain addresses
 * @returns Merged and deduplicated addresses for external and internal
 */
const mergeAddresses = (
  pAddresses: NetworkAddresses,
  xAddresses: NetworkAddresses
): NormalizedXPAddresses => {
  // Use the longer response for external addresses to ensure we get all addresses
  const longerResponse = isResponseLonger(pAddresses, xAddresses)
    ? pAddresses
    : xAddresses

  // Merge and deduplicate external addresses using Map (address as key)
  const externalMap = new Map<string, number>()

  for (const addr of longerResponse.externalAddresses) {
    const addressWithoutPrefix = xpAddressWithoutPrefix(addr.address)
    // Keep the first occurrence (or you could keep the one with lower index)
    if (!externalMap.has(addressWithoutPrefix)) {
      externalMap.set(addressWithoutPrefix, addr.index)
    }
  }

  const externalAddresses = Array.from(externalMap.entries()).map(
    ([address, index]) => ({
      address,
      index
    })
  )

  // Merge and deduplicate internal addresses
  // Note: X-Chain typically has internal addresses, but we check both just in case
  const internalMap = new Map<string, number>()

  const allInternalAddresses = [
    ...xAddresses.internalAddresses,
    ...pAddresses.internalAddresses
  ]

  for (const addr of allInternalAddresses) {
    const addressWithoutPrefix = xpAddressWithoutPrefix(addr.address)
    if (!internalMap.has(addressWithoutPrefix)) {
      internalMap.set(addressWithoutPrefix, addr.index)
    }
  }

  const internalAddresses = Array.from(internalMap.entries()).map(
    ([address, index]) => ({
      address,
      index
    })
  )

  return { externalAddresses, internalAddresses }
}

export const getAddressesFromXpubXP = async ({
  isTestnet,
  walletId,
  walletType,
  accountIndex
}: {
  isTestnet: boolean
  walletId: string
  walletType: WalletType
  accountIndex: number
}): Promise<NormalizedXPAddresses> => {
  const xpubXP = await WalletService.getRawXpubXP({
    walletId,
    walletType,
    accountIndex
  })

  const avmAddresses = await ProfileService.fetchXPAddresses({
    xpubXP,
    networkType: NetworkVMType.AVM,
    isTestnet,
    onlyWithActivity: false
  })

  const pvmAddresses = await ProfileService.fetchXPAddresses({
    xpubXP,
    networkType: NetworkVMType.PVM,
    isTestnet,
    onlyWithActivity: false
  })

  return mergeAddresses(pvmAddresses, avmAddresses)
}

export const getXpubXPIfAvailable = async ({
  walletId,
  walletType,
  accountIndex
}: {
  walletId: string
  walletType: WalletType
  accountIndex: number
}): Promise<string | undefined> => {
  let xpubXP

  try {
    xpubXP = await WalletService.getRawXpubXP({
      walletId,
      walletType,
      accountIndex
    })
  } catch (error) {
    xpubXP = undefined
  }

  return xpubXP
}
