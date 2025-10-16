import { NetworkVMType } from '@avalabs/core-chains-sdk'
import WalletService from 'services/wallet/WalletService'
import { WalletType, NetworkAddresses } from 'services/wallet/types'
import { xpAddressWithoutPrefix } from 'new/common/utils/xpAddressWIthoutPrefix'

type FlattenedAddresses = {
  external: string[]
  internal: string[]
}

const isResponseLonger = (
  response1: NetworkAddresses,
  response2: NetworkAddresses
): boolean => {
  return response1.externalAddresses.length > response2.externalAddresses.length
}

const flattenAddresses = (
  pAddresses: NetworkAddresses,
  xAddresses: NetworkAddresses
): FlattenedAddresses => {
  const longerResponse = isResponseLonger(pAddresses, xAddresses)
    ? pAddresses
    : xAddresses

  const external = Array.from(
    new Set(
      longerResponse.externalAddresses.map(a =>
        xpAddressWithoutPrefix(a.address)
      )
    )
  )

  const internal = Array.from(
    new Set(
      xAddresses.internalAddresses.map(a => xpAddressWithoutPrefix(a.address))
    )
  )

  return { external, internal }
}

export const getAddressesFromXpubXP = async ({
  isDeveloperMode,
  walletId,
  walletType
}: {
  isDeveloperMode: boolean
  walletId: string
  walletType: WalletType
}): Promise<{ external: string[]; internal: string[] }> => {
  const avmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.AVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity: false
  })

  const pvmAddresses = await WalletService.getAddressesFromXpubXP({
    walletId: walletId,
    walletType: walletType,
    networkType: NetworkVMType.PVM,
    isTestnet: isDeveloperMode,
    onlyWithActivity: false
  })

  return flattenAddresses(pvmAddresses, avmAddresses)
}
