import { Contact } from 'store/addressBook'
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
import { RecipientType } from '../context/sendContext'

export const getNetworks = ({
  to,
  recipientType,
  allNetworks,
  isDeveloperMode,
  contacts
}: {
  to?: Contact | string
  recipientType?: RecipientType
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
    if (isValidAddress({ address, addressType: AddressType.EVM })) {
      const networks: Network[] = []
      const ethereumNetwork = getEthereumNetwork(allNetworks, isDeveloperMode)
      const avalancheCChain = getAvalancheNetwork(allNetworks, isDeveloperMode)
      ethereumNetwork && networks.push(ethereumNetwork)
      avalancheCChain && networks.push(avalancheCChain)
      return networks
    }
    if (isValidAddress({ address, addressType: AddressType.XP })) {
      return isDeveloperMode
        ? [NETWORK_P_TEST, NETWORK_X_TEST]
        : [NETWORK_P, NETWORK_X]
    }
    if (isValidAddress({ address, addressType: AddressType.BTC })) {
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
