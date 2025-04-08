export type Contact = {
  id: string
  name?: string
  addressC?: string
  addressAVM?: string
  addressPVM?: string
  isKnown?: boolean
  addressBTC?: string
  addressEVM?: string
  avatar?: string
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
