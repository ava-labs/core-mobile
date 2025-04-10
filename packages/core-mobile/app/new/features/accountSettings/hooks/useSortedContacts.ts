import { IndexPath } from '@avalabs/k2-alpine'
import { useMemo, useState } from 'react'
import { DropdownSelection } from 'new/common/types'
import { Contact, selectContacts } from 'store/addressBook'
import { useSelector } from 'react-redux'

export const useSortedContacts = (): {
  data: Contact[]
  sort: DropdownSelection
} => {
  const contactCollection = useSelector(selectContacts)
  const contacts = useMemo(() => {
    return Object.values(contactCollection)
  }, [contactCollection])

  const [selectedSort, setSelectedSort] = useState<IndexPath>({
    section: 0,
    row: 0
  })

  const sortedContacts = useMemo(() => {
    if (selectedSort.row === 0) {
      return contacts.sort((a, b) => {
        if (a.name && b.name) {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        }
        return a.name ? -1 : 1
      })
    }
    return contacts.sort((a, b) => {
      if (a.name && b.name) {
        return b.name.toLowerCase().localeCompare(a.name.toLowerCase())
      }
      return a.name ? -1 : 1
    })
  }, [selectedSort, contacts])

  return {
    sort: {
      title: 'Sort',
      data: CONTACT_SORTS,
      selected: selectedSort,
      onSelected: setSelectedSort
    },
    data: sortedContacts
  }
}

enum ContactSort {
  NameAtoZ = 'Name A to Z',
  NameZtoA = 'Name Z to A'
}

type ContactSorts = ContactSort[][]

const CONTACT_SORTS: ContactSorts = [
  [ContactSort.NameAtoZ, ContactSort.NameZtoA]
]
