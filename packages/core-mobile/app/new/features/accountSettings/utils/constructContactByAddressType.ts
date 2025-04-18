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
      return { ...contact, address }
    case AddressType.XP: {
      return {
        ...contact,
        addressXP: xpAddressWithoutPrefix(address ?? '')
      }
    }
    case AddressType.BTC:
      return { ...contact, addressBTC: address }
  }
}
