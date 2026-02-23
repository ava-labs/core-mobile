import { Contact } from 'store/addressBook'

export const filterContactsBySearchText = (
  contacts: Contact[],
  searchText: string
): Contact[] => {
  return contacts.filter(
    contact =>
      contact.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.address?.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.addressXP?.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.addressBTC?.toLowerCase().includes(searchText.toLowerCase()) ||
      contact.addressSVM?.toLowerCase().includes(searchText.toLowerCase())
  )
}
