import { Contact } from 'store/addressBook'
import { AddressType } from '../consts'

export const constructContactByAddressType = (
  contact: Contact,
  addressType: AddressType,
  address?: string
  // eslint-disable-next-line sonarjs/cognitive-complexity
): Contact => {
  switch (addressType) {
    case AddressType.CChain:
      if (contact.addressEVM !== undefined || address === undefined) {
        return { ...contact, addressC: address }
      }
      return { ...contact, addressC: address, addressEVM: address }
    case AddressType.EVM:
      if (contact.addressC !== undefined || address === undefined) {
        return { ...contact, addressEVM: address }
      }
      return { ...contact, addressC: address, addressEVM: address }
    case AddressType.PVM: {
      const addressPVM = address?.startsWith('P-') ? address : `P-${address}`
      const addressAVM = address?.startsWith('X-') ? address : `X-${address}`
      if (address === undefined) {
        return { ...contact, addressPVM: undefined }
      }
      if (contact.addressAVM !== undefined) {
        return { ...contact, addressPVM }
      }
      return {
        ...contact,
        addressPVM,
        addressAVM
      }
    }
    case AddressType.AVM: {
      if (address === undefined) {
        return { ...contact, addressAVM: undefined }
      }
      const addressPVM = address.startsWith('P-') ? address : `P-${address}`
      const addressAVM = address.startsWith('X-') ? address : `X-${address}`
      if (contact.addressPVM !== undefined) {
        return { ...contact, addressAVM }
      }
      return { ...contact, addressPVM, addressAVM }
    }
    case AddressType.BTC:
      return { ...contact, addressBTC: address }
  }
}
