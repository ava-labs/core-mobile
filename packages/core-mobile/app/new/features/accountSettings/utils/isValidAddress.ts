import { isAddress } from 'ethers'
import { Avalanche } from '@avalabs/core-wallets-sdk'
import { isBtcAddress } from 'utils/isBtcAddress'
import { isAddress as isSolanaAddress } from '@solana/kit'
import { AddressType } from '../consts'

export const isValidAddress = ({
  addressType,
  address,
  isDeveloperMode
}: {
  addressType?: AddressType
  address: string
  isDeveloperMode: boolean
}): boolean => {
  const addressWithoutPrefix = address.replace(/^[PX]-/, '')

  if (addressType === undefined) {
    return (
      isAddress(address) ||
      isBtcAddress(address, !isDeveloperMode) ||
      isSolanaAddress(address) ||
      (Avalanche.isBech32Address(addressWithoutPrefix, false) &&
        ((isDeveloperMode && addressWithoutPrefix.includes('fuji')) ||
          (!isDeveloperMode && addressWithoutPrefix.includes('avax'))))
    )
  }

  switch (addressType) {
    case AddressType.EVM:
    case AddressType.EVM_TESTNET:
      return isAddress(address)
    case AddressType.XP:
    case AddressType.XP_TESTNET: {
      return (
        Avalanche.isBech32Address(addressWithoutPrefix, false) &&
        ((isDeveloperMode && addressWithoutPrefix.includes('fuji')) ||
          (!isDeveloperMode && addressWithoutPrefix.includes('avax')))
      )
    }
    case AddressType.BTC:
    case AddressType.BTC_TESTNET:
      return isBtcAddress(address, !isDeveloperMode)
    case AddressType.SOLANA:
    case AddressType.SOLANA_DEVNET:
      return isSolanaAddress(address)
  }
}
