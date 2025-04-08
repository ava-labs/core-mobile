import { Contact } from 'store/addressBook'

export const getAddressFromContact = (contact: Contact): string | undefined => {
  if (contact.addressC) return contact.addressC
  if (contact.addressEVM) return contact.addressEVM
  if (contact.addressBTC) return contact.addressBTC
  if (contact.addressPVM) return contact.addressPVM
  if (contact.addressAVM) return contact.addressAVM
  return undefined
}
