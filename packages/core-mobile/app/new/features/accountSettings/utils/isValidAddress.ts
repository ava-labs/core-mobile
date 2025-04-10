import { isAddress } from 'ethers'
import { isBech32Address } from '@avalabs/core-bridge-sdk'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isBtcAddress } from 'utils/isBtcAddress'
import { AddressType } from '../consts'

export const isValidAddress = (
  addressType: AddressType,
  address: string,
  isDeveloperMode = false
): boolean => {
  switch (addressType) {
    case AddressType.EVM:
      return isAddress(address) || isBech32Address(address)
    case AddressType.XP:
      return (
        Avalanche.isBech32Address(address, false) &&
        ((isDeveloperMode && address.includes('fuji')) ||
          (!isDeveloperMode && address.includes('avax')))
      )
    case AddressType.BTC:
      return isBtcAddress(address, !isDeveloperMode)
  }
}
