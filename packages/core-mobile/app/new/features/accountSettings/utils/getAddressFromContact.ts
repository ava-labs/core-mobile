import { Contact } from 'store/addressBook'

export const getAddressFromContact = (contact: Contact): string | undefined => {
  if (contact.address) return contact.address
  if (contact.addressXP) return contact.addressXP
  if (contact.addressBTC) return contact.addressBTC
  return undefined
}
