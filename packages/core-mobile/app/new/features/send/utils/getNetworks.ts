import { AddrBookItemType, Contact } from 'store/addressBook'
import { Networks } from 'store/network'
import { Network } from '@avalabs/core-chains-sdk'
import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'
import { AddressType } from 'features/accountSettings/consts'
import {
  getAvalancheNetwork,
  getBitcoinNetwork,
  getEthereumNetwork
} from 'services/network/utils/providerUtils'
import {
  NETWORK_P,
  NETWORK_P_TEST,
  NETWORK_X,
  NETWORK_X_TEST
} from 'services/network/consts'

/**
 * Returns the networks for the given address.
 * If the address is a string, it checks if it's a valid address and returns the corresponding networks.
 * If the address is an object, it checks the type of address and returns the corresponding networks.
 * @param {string | Contact} to - The address or contact to get networks for.
 * @param {AddrBookItemType | 'address'} recipientType - The type of recipient (address or contact).
 * @param {Networks} allNetworks - All available networks.
 * @param {boolean} isDeveloperMode - Whether developer mode is enabled.
 * @param {Contact[]} contacts - List of contacts.
 * @returns {Network[]} - The list of networks for the given address.
 */
export const getNetworks = ({
  to,
  recipientType,
  allNetworks,
  isDeveloperMode,
  contacts
}: {
  to?: Contact | string
  recipientType?: AddrBookItemType | 'address'
  allNetworks: Networks
  isDeveloperMode: boolean
  contacts: Contact[]
  // eslint-disable-next-line sonarjs/cognitive-complexity
}): Network[] => {
  const address =
    recipientType === 'address'
      ? to
      : contacts.find(contact => contact.id === to)

  if (address === undefined || to === undefined) return []

  if (typeof address === 'string') {
    if (
      isValidAddress({ address, addressType: AddressType.EVM, isDeveloperMode })
    ) {
      const networks: Network[] = []
      const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)
      const avalancheCChain = getAvalancheNetwork(allNetworks, isDeveloperMode)
      ethereumNetwork && networks.push(ethereumNetwork)
      avalancheCChain && networks.push(avalancheCChain)
      return networks
    }
    if (
      isValidAddress({ address, addressType: AddressType.XP, isDeveloperMode })
    ) {
      return isDeveloperMode
        ? [NETWORK_P_TEST, NETWORK_X_TEST]
        : [NETWORK_P, NETWORK_X]
    }
    if (
      isValidAddress({ address, addressType: AddressType.BTC, isDeveloperMode })
    ) {
      return [getBitcoinNetwork(isDeveloperMode)]
    }
    return []
  }
  const networks: Network[] = []
  if ('address' in address) {
    const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)
    const avalancheCChain = getAvalancheNetwork(allNetworks, isDeveloperMode)
    ethereumNetwork && networks.push(ethereumNetwork)
    avalancheCChain && networks.push(avalancheCChain)
  }
  if ('addressXP' in address) {
    networks.push(isDeveloperMode ? NETWORK_P_TEST : NETWORK_P)
    networks.push(isDeveloperMode ? NETWORK_X_TEST : NETWORK_X)
  }
  if ('addressBTC' in address) {
    networks.push(getBitcoinNetwork(isDeveloperMode))
  }
  return networks
}
