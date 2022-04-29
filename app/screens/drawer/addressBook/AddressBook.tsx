import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useMemo, useState } from 'react'
import SearchBar from 'components/SearchBar'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { AddressBookScreenProps } from 'navigation/types'
import { Contact } from 'Repo'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.List
>['navigation']

const AddressBook = () => {
  const { navigate } = useNavigation<NavigationProp>()
  const { addressBook } = useApplicationContext().repo.addressBookRepo
  const [searchFilter, setSearchFilter] = useState('')

  const contacts = useMemo<Contact[]>(() => {
    return [...addressBook.entries()]
      .filter(([, contact]) => contact.title.search(searchFilter) !== -1)
      .map(([, contact]) => {
        return contact
      })
  }, [addressBook, searchFilter])

  const renderAccountItem = (item: ListRenderItemInfo<Contact>) => {
    return (
      <AddressBookItem
        title={item.item.title}
        address={item.item.address}
        onPress={() => {
          navigate(AppNavigation.AddressBook.Details, {
            contactId: item.item.id,
            editable: false
          })
        }}
      />
    )
  }

  return (
    <SafeAreaProvider style={{ flex: 1, paddingHorizontal: 16 }}>
      <SearchBar searchText={searchFilter} onTextChanged={setSearchFilter} />
      <FlatList data={contacts} renderItem={renderAccountItem} />
    </SafeAreaProvider>
  )
}

export default AddressBook
