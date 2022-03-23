import React, {useMemo} from 'react';
import {FlatList, View} from 'react-native';
import ZeroState from 'components/ZeroState';
import TabViewAva from 'components/TabViewAva';
import AvaText from 'components/AvaText';
import {AccountId, AddrBookItemType, Contact, UID} from 'Repo';
import {useApplicationContext} from 'contexts/ApplicationContext';
import {Account} from 'dto/Account';
import AddressBookItem from 'components/addressBook/AddressBookItem';

export type AddressBookListsProps = {
  onContactSelected: (item: Contact | Account, type: AddrBookItemType) => void;
  navigateToAddressBook: () => void;
};
export default function AddressBookLists({
  onContactSelected,
  navigateToAddressBook,
}: AddressBookListsProps) {
  const {theme} = useApplicationContext();
  const {recentContacts, addressBook} =
    useApplicationContext().repo.addressBookRepo;
  const {accounts} = useApplicationContext().repo.accountsRepo;

  const addressBookContacts = useMemo(
    () => [...addressBook.values()],
    [addressBook],
  );

  const recentAddresses = useMemo(
    () =>
      recentContacts.map(contact => {
        switch (contact.type) {
          case 'account':
            return {
              item: accounts.get(contact.id as AccountId)!,
              type: contact.type,
            };
          case 'contact':
            return {
              item: addressBook.get(contact.id as UID)!,
              type: contact.type,
            };
        }
      }),
    [addressBook, recentContacts, accounts],
  );

  const renderCustomLabel = (title: string, selected: boolean) => {
    return selected ? (
      <AvaText.ButtonMedium
        ellipsizeMode={'tail'}
        textStyle={{
          color: theme.alternateBackground,
        }}>
        {title}
      </AvaText.ButtonMedium>
    ) : (
      <AvaText.Body2 ellipsizeMode={'tail'} textStyle={{lineHeight: 24}}>
        {title}
      </AvaText.Body2>
    );
  };

  return (
    <TabViewAva renderCustomLabel={renderCustomLabel}>
      <FlatList
        title={'Recents'}
        data={recentAddresses}
        renderItem={info =>
          renderItem(info.item, (item, type) => onContactSelected(item, type))
        }
        keyExtractor={item => item.item.title + item.item.address}
        contentContainerStyle={{paddingHorizontal: 16}}
        ListEmptyComponent={
          <View style={{marginVertical: 40}}>
            <ZeroState.NoRecentAccounts />
          </View>
        }
      />
      <FlatList
        title={'Address Book'}
        data={addressBookContacts}
        renderItem={info =>
          renderItem({item: info.item, type: 'contact'}, (item, type) =>
            onContactSelected(item, type),
          )
        }
        keyExtractor={item => item.id}
        contentContainerStyle={{paddingHorizontal: 16}}
        ListEmptyComponent={
          <View style={{marginVertical: 40}}>
            <ZeroState.EmptyAddressBook
              onGoToAddressBook={navigateToAddressBook}
            />
          </View>
        }
      />
      <FlatList
        title={'My accounts'}
        data={[...accounts.values()]}
        renderItem={info =>
          renderItem({item: info.item, type: 'account'}, (item, type) =>
            onContactSelected(item, type),
          )
        }
        contentContainerStyle={{paddingHorizontal: 16}}
        ListEmptyComponent={<ZeroState.NoResultsGraphical />}
      />
    </TabViewAva>
  );
}

const renderItem = (
  item: {item: Contact | Account; type: AddrBookItemType},
  onPress: (item: Contact | Account, type: AddrBookItemType) => void,
) => {
  return (
    <AddressBookItem
      title={item.item.title}
      address={item.item.address}
      onPress={() => {
        onPress(item.item, item.type);
      }}
    />
  );
};
