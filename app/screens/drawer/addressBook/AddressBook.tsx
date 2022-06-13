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
      .filter(
        ([, contact]) =>
          contact.title.toLowerCase().search(searchFilter.toLowerCase()) !== -1
      )
      .map(([, contact]) => {
        return contact
      })
  }, [addressBook, searchFilter])

  const renderContactItem = (item: ListRenderItemInfo<Contact>) => {
    return (
      <AddressBookItem
        title={item.item.title}
        address={item.item.address}
        addressBtc={item.item.addressBtc}
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
      <FlatList data={contacts} renderItem={renderContactItem} />
    </SafeAreaProvider>
  )
}

export default AddressBook
