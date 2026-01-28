import { Contact } from 'store/addressBook'

/**
 * Determines if a contact should be removed based on whether it has any addresses.
 * A contact should be removed when all of its address fields are undefined.
 *
 * @param contact - The contact to check
 * @returns true if the contact has no addresses and should be removed
 */
export const shouldRemoveContact = (contact: Contact): boolean => {
  const numOfAddresses = Object.keys(contact).filter(
    key =>
      key.startsWith('address') &&
      (contact as Record<string, unknown>)[key] !== undefined
  )
  return numOfAddresses.length === 0
}
