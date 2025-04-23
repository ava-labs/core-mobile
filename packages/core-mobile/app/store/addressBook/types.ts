import { Contact as _Contact } from '@avalabs/types'

export type Contact = Omit<_Contact, 'address' | 'addressSVM'> & {
  address?: string
  avatar?: string
  type?: AddrBookItemType
}

export type ContactCollection = { [uid: UID]: Contact }

export type AddressBookState = {
  contacts: ContactCollection
  recentContacts: RecentContact[]
  editingContact: Contact | undefined
}

export type RecentContact = {
  id: AccountId | UID
  type: AddrBookItemType
}

export type AddrBookItemType = 'account' | 'contact'

export type AccountId = number

export type UID = string
