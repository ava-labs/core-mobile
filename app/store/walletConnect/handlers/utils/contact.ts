import { Contact as SharedContact } from '@avalabs/types'
import { Contact } from 'Repo'
import { getContactValidationError } from 'screens/drawer/addressBook/utils'

export const parseContact = (params: SharedContact[] | undefined) => {
  const contact = params?.[0]

  if (
    getContactValidationError(
      contact?.name,
      contact?.address,
      contact?.addressBTC
    ) === undefined
  ) {
    return contact
  }

  return undefined
}

export const mapContactToSharedContact = (contact: Contact): SharedContact => ({
  id: contact.id,
  name: contact.title,
  address: contact.address,
  addressBTC: contact.addressBtc
})
