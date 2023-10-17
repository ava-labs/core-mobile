import { useState } from 'react'
import { Account } from 'store/account'
import { useDispatch } from 'react-redux'
import {
  AddrBookItemType,
  Contact,
  RecentContact,
  addRecentContact
} from 'store/addressBook'

export function useAddressBookLists() {
  const dispatch = useDispatch()
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [tempRecentContact, setTempRecentContact] = useState<
    RecentContact | undefined
  >(undefined)

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType
  ) => {
    switch (type) {
      case 'account':
        setTempRecentContact({ id: (item as Account).index, type: type })
        break
      case 'contact':
        setTempRecentContact({ id: (item as Contact).id, type: type })
        break
    }
  }

  const saveRecentContact = () => {
    if (tempRecentContact) {
      dispatch(addRecentContact(tempRecentContact))
    }
  }

  const reset = () => {
    setTempRecentContact(undefined)
  }

  return {
    showAddressBook,
    setShowAddressBook,
    onContactSelected,
    saveRecentContact,
    reset
  }
}
