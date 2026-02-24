import { NetworkVMType } from '@avalabs/vm-module-types'
import { Contact } from 'store/addressBook'
import { getAddressByVmName } from './getAddressByVmName'

/**
 * Returns the address to display for a contact in search results.
 * When there's an active search, prioritizes the address field that
 * matched the search text so the user sees the relevant address.
 * Falls back to getAddressByVmName for non-search contexts (e.g. recents).
 */
export const getMatchingAddress = ({
  contact,
  searchText,
  vmName,
  isDeveloperMode
}: {
  contact: Contact
  searchText: string
  vmName?: NetworkVMType
  isDeveloperMode: boolean
}): string | undefined => {
  if (searchText.trim().length > 0) {
    const lowerSearch = searchText.toLowerCase()
    const addressFields = [
      contact.address,
      contact.addressXP,
      contact.addressBTC,
      contact.addressSVM
    ]
    const matched = addressFields.find(addr =>
      addr?.toLowerCase().includes(lowerSearch)
    )
    if (matched) return matched
  }

  return getAddressByVmName({
    contact,
    vmName,
    isDeveloperMode
  })
}
