import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useMemo, useState } from 'react'
import SearchBar from 'components/SearchBar'
import { FlatList, ListRenderItemInfo } from 'react-native'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { AddressBookScreenProps } from 'navigation/types'
import { Contact } from 'Repo'
import { useSelector } from 'react-redux'
import { selectContacts } from 'store/addressBook'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.List
>['navigation']

const AddressBook = () => {
  const { navigate } = useNavigation<NavigationProp>()
  const contacts = useSelector(selectContacts)
  const [searchFilter, setSearchFilter] = useState('')

  const filteredContacts = useMemo<Contact[]>(() => {
    return Object.values(contacts).filter(
      contact =>
        contact.title.toLowerCase().search(searchFilter.toLowerCase()) !== -1
    )
  }, [contacts, searchFilter])

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
      <FlatList data={filteredContacts} renderItem={renderContactItem} />
    </SafeAreaProvider>
  )
}

export default AddressBook
