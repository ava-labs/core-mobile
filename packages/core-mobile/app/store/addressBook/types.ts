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

export type Contact = {
  address: string
  addressBtc: string
  addressPVM: string
  title: string
  id: string
}
