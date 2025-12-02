import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { WalletType } from 'services/wallet/types'
import { xpAddressWithoutPrefix } from 'new/common/utils/xpAddressWIthoutPrefix'
import { GetAddressesResponse } from '../apiClient/profile/types'

function convertResponseToXPAddressList(
  response: GetAddressesResponse
): string[] {
  const addresses: string[] = []

  for (const item of response.externalAddresses) {
    addresses.push(xpAddressWithoutPrefix(item.address))
  }

  for (const item of response.internalAddresses) {
    addresses.push(xpAddressWithoutPrefix(item.address))
  }

  return addresses
}

export const getAddressesFromXpubXP = async ({
  isDeveloperMode,
  walletId,
  walletType,
  accountIndex,
  onlyWithActivity
}: {
  isDeveloperMode: boolean
  walletId: string
  walletType: WalletType
  accountIndex: number
  onlyWithActivity: boolean
}): Promise<string[]> => {
  const avmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.AVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity,
    accountIndex
  })

  const pvmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.PVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity,
    accountIndex
  })

  const avmList = convertResponseToXPAddressList(avmAddresses)
  const pvmList = convertResponseToXPAddressList(pvmAddresses)

  return Array.from(new Set([...avmList, ...pvmList])).sort()
}
