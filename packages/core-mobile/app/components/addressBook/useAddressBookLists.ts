import { useState } from 'react'
import { Account } from 'store/account'
import { useDispatch } from 'react-redux'
import {
  AddrBookItemType,
  RecentContact,
  addRecentContact
} from 'store/addressBook'
import { Contact } from '@avalabs/types'

export function useAddressBookLists(): {
  onContactSelected: (item: Contact | Account, type: AddrBookItemType) => void
  showAddressBook: boolean
  saveRecentContact: () => void
  reset: () => void
  setShowAddressBook: (
    value: ((prevState: boolean) => boolean) | boolean
  ) => void
} {
  const dispatch = useDispatch()
  const [showAddressBook, setShowAddressBook] = useState(false)
  const [tempRecentContact, setTempRecentContact] = useState<
    RecentContact | undefined
  >(undefined)

  const onContactSelected = (
    item: Contact | Account,
    type: AddrBookItemType
  ): void => {
    switch (type) {
      case 'account':
        setTempRecentContact({
          id: (item as Account).index,
          type: type
        })
        break
      case 'contact':
        setTempRecentContact({ id: (item as Contact).id, type: type })
        break
    }
  }

  const saveRecentContact = (): void => {
    if (tempRecentContact) {
      dispatch(addRecentContact(tempRecentContact))
    }
  }

  const reset = (): void => {
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
