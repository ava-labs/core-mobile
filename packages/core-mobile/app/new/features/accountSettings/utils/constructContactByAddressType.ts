import { Contact } from 'store/addressBook'
import { xpAddressWithoutPrefix } from 'common/utils/xpAddressWIthoutPrefix'
import { AddressType } from '../consts'

export const constructContactByAddressType = (
  contact: Contact,
  addressType: AddressType,
  address?: string
): Contact => {
  switch (addressType) {
    case AddressType.EVM:
    case AddressType.EVM_TESTNET:
      return { ...contact, address }
    case AddressType.XP:
    case AddressType.XP_TESTNET: {
      return {
        ...contact,
        addressXP: address ? xpAddressWithoutPrefix(address) : undefined
      }
    }
    case AddressType.BTC:
    case AddressType.BTC_TESTNET:
      return { ...contact, addressBTC: address }
  }
}
