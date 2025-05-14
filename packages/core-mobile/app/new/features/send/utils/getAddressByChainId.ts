import { ChainId } from '@avalabs/core-chains-sdk'
import { Contact } from 'store/addressBook'

/**
 * @description Checks if the contact has an address based on the chain ID and developer mode.
 * @param contact - The contact to check.
 * @param chainId - The chain ID to check against.
 * @param isDeveloperMode - Whether the app is in developer mode.
 * @returns address if the contact has an address for the given chain ID and developer mode, undefined otherwise.
 */
export const getAddressByChainId = ({
  contact,
  chainId,
  isDeveloperMode
}: {
  contact: Contact
  chainId?: number
  isDeveloperMode: boolean
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): string | undefined => {
  if (
    contact.address &&
    (((chainId === ChainId.AVALANCHE_MAINNET_ID ||
      chainId === ChainId.ETHEREUM_HOMESTEAD) &&
      isDeveloperMode === false) ||
      ((chainId === ChainId.AVALANCHE_TESTNET_ID ||
        chainId === ChainId.ETHEREUM_TEST_SEPOLIA ||
        chainId === ChainId.ETHEREUM_TEST_GOERLY) &&
        isDeveloperMode === true))
  ) {
    return contact.address
  }

  if (
    contact.addressXP &&
    (((chainId === ChainId.AVALANCHE_P || chainId === ChainId.AVALANCHE_X) &&
      isDeveloperMode === false) ||
      ((chainId === ChainId.AVALANCHE_TEST_P ||
        chainId === ChainId.AVALANCHE_TEST_X) &&
        isDeveloperMode === true))
  ) {
    return contact.addressXP
  }

  if (
    contact.addressBTC &&
    ((chainId === ChainId.BITCOIN && isDeveloperMode === false) ||
      (chainId === ChainId.BITCOIN_TESTNET && isDeveloperMode === true))
  ) {
    return contact.addressBTC
  }

  return undefined
}
