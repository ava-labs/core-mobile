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
    case AddressType.EVM_TESTNET:
      return isAddress(address) || isBech32Address(address)
    case AddressType.XP:
    case AddressType.XP_TESTNET: {
      const addressWithoutPrefix = address.replace(/^[PX]-/, '')
      return (
        Avalanche.isBech32Address(addressWithoutPrefix, false) &&
        ((isDeveloperMode && addressWithoutPrefix.includes('fuji')) ||
          (!isDeveloperMode && addressWithoutPrefix.includes('avax')))
      )
    }
    case AddressType.BTC:
    case AddressType.BTC_TESTNET:
      return isBtcAddress(address, !isDeveloperMode)
  }
}
