import { SafeAreaProvider } from 'react-native-safe-area-context'
import React, { useMemo, useState } from 'react'
import SearchBar from 'components/SearchBar'
import { FlatList, ListRenderItemInfo } from 'react-native'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { useNavigation } from '@react-navigation/native'
import AppNavigation from 'navigation/AppNavigation'
import { AddressBookScreenProps } from 'navigation/types'
import { useSelector } from 'react-redux'
import { selectContacts } from 'store/addressBook'
import { Contact } from '@avalabs/types'
import ZeroState from 'components/ZeroState'

type NavigationProp = AddressBookScreenProps<
  typeof AppNavigation.AddressBook.List
>['navigation']

const AddressBook = (): JSX.Element => {
  const { navigate } = useNavigation<NavigationProp>()
  const contacts = useSelector(selectContacts)
  const [searchFilter, setSearchFilter] = useState('')

  const filteredContacts = useMemo<Contact[]>(() => {
    return Object.values(contacts).filter(
      contact =>
        contact.name.toLowerCase().search(searchFilter.toLowerCase()) !== -1
    )
  }, [contacts, searchFilter])

  const renderContactItem = (
    item: ListRenderItemInfo<Contact>
  ): JSX.Element => {
    return (
      <AddressBookItem
        title={item.item.name}
        address={item.item.address}
        addressBtc={item.item.addressBTC}
        onPress={() => {
          navigate(AppNavigation.AddressBook.Details, {
            contactId: item.item.id,
            editable: false
          })
        }}
      />
    )
  }

  const addContact = (): void => navigate(AppNavigation.AddressBook.Add)

  const contentContainerStyle =
    filteredContacts.length === 0 ? { flex: 0.7 } : { flex: 0 }

  return (
    <SafeAreaProvider style={{ flex: 1, paddingHorizontal: 16 }}>
      <SearchBar searchText={searchFilter} onTextChanged={setSearchFilter} />
      <FlatList
        contentContainerStyle={contentContainerStyle}
        data={filteredContacts}
        renderItem={renderContactItem}
        ListEmptyComponent={<ZeroState.NoContacts addContact={addContact} />}
      />
    </SafeAreaProvider>
  )
}

export default AddressBook
