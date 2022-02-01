import {SafeAreaProvider} from 'react-native-safe-area-context';
import React, {useMemo, useState} from 'react';
import SearchBar from 'components/SearchBar';
import {FlatList, ListRenderItemInfo} from 'react-native';
import {useApplicationContext} from 'contexts/ApplicationContext';
import AvaButton from 'components/AvaButton';
import AddressBookItem from 'components/addressBook/AddressBookItem';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {AddressBookStackParamList} from 'navigation/wallet/AddressBookStack';
import AppNavigation from 'navigation/AppNavigation';
import {Contact} from 'Repo';

const AddressBook = () => {
  const {navigate} =
    useNavigation<StackNavigationProp<AddressBookStackParamList>>();
  const {addressBook} = useApplicationContext().repo.addressBookRepo;
  const [searchFilter, setSearchFilter] = useState('');

  const contacts = useMemo<Contact[]>(() => {
    return [...addressBook.entries()]
      .filter(([, contact]) => contact.title.search(searchFilter) !== -1)
      .map(([, contact]) => {
        return contact;
      });
  }, [addressBook, searchFilter]);

  const renderAccountItem = (item: ListRenderItemInfo<Contact>) => {
    return (
      <AvaButton.Base
        onPress={() => {
          navigate(AppNavigation.AddressBook.Details, {
            contactId: item.item.id,
            editable: false,
          });
        }}>
        <AddressBookItem title={item.item.title} address={item.item.address} />
      </AvaButton.Base>
    );
  };

  return (
    <SafeAreaProvider style={{flex: 1, paddingHorizontal: 16}}>
      <SearchBar onTextChanged={value => setSearchFilter(value)} />
      <FlatList data={contacts} renderItem={renderAccountItem} />
    </SafeAreaProvider>
  );
};

export default AddressBook;
