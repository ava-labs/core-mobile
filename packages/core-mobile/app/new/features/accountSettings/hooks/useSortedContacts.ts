import { useMemo, useState } from 'react'
import { DropdownSelection } from 'new/common/types'
import { Contact, selectContacts } from 'store/addressBook'
import { useSelector } from 'react-redux'
import { DropdownGroup } from 'common/components/DropdownMenu'

export const useSortedContacts = (): {
  data: Contact[]
  sort: DropdownSelection
} => {
  const contactCollection = useSelector(selectContacts)
  const contacts = useMemo(() => {
    return Object.values(contactCollection)
  }, [contactCollection])

  const [selectedSort, setSelectedSort] = useState<ContactSort>(
    ContactSort.NameAtoZ
  )

  const sortedContacts = useMemo(() => {
    if (selectedSort === ContactSort.NameAtoZ) {
      return contacts.toSorted((a, b) => {
        if (a.name && b.name) {
          return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
        }
        return a.name ? -1 : 1
      })
    }
    return contacts.toSorted((a, b) => {
      if (a.name && b.name) {
        return b.name.toLowerCase().localeCompare(a.name.toLowerCase())
      }
      return a.name ? -1 : 1
    })
  }, [selectedSort, contacts])

  const sortedData = useMemo(() => {
    return CONTACT_SORTS.map(s => {
      return {
        key: s.key,
        items: s.items.map(i => ({
          id: i.id,
          title: i.id,
          selected: i.id === selectedSort
        }))
      }
    })
  }, [selectedSort])

  return {
    sort: {
      title: 'Sort',
      data: sortedData,
      selected: selectedSort,
      onSelected: (value: string) => {
        setSelectedSort(value as ContactSort)
      }
    },
    data: sortedContacts
  }
}

enum ContactSort {
  NameAtoZ = 'Name A to Z',
  NameZtoA = 'Name Z to A'
}

export const CONTACT_SORTS: DropdownGroup[] = [
  {
    key: 'contact-sorts',
    items: [
      {
        id: ContactSort.NameAtoZ,
        title: ContactSort.NameAtoZ
      },
      {
        id: ContactSort.NameZtoA,
        title: ContactSort.NameZtoA
      }
    ]
  }
]
