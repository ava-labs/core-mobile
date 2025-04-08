import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'

export const constructContactByAddressType = (
  contact: Contact,
  addressType: AddressType,
  address?: string
): Contact => {
  switch (addressType) {
    case AddressType.CChain:
      return { ...contact, addressC: address }
    case AddressType.PVM:
      return { ...contact, addressPVM: address }
    case AddressType.AVM:
      return { ...contact, addressAVM: address }
    case AddressType.EVM:
      return { ...contact, addressEVM: address }
    case AddressType.BTC:
      return { ...contact, addressBTC: address }
  }
}
