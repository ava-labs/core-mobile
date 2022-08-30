import React, { useMemo } from 'react'
import { FlatList, View } from 'react-native'
import ZeroState from 'components/ZeroState'
import TabViewAva from 'components/TabViewAva'
import AvaText from 'components/AvaText'
import { AccountId, AddrBookItemType, Contact } from 'Repo'
import { useApplicationContext } from 'contexts/ApplicationContext'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { useSelector } from 'react-redux'
import { Account, selectAccounts } from 'store/account'
import { selectContacts, selectRecentContacts } from 'store/addressBook'
import { selectActiveNetwork } from 'store/network'
import { Network, NetworkVMType } from '@avalabs/chains-sdk'

export type AddressBookSource = 'recents' | 'addressBook' | 'accounts'

export type AddressBookListsProps = {
  onContactSelected: (
    item: Contact | Account,
    type: AddrBookItemType,
    source: AddressBookSource
  ) => void
  navigateToAddressBook: () => void
  onlyBtc?: boolean
}
export default function AddressBookLists({
  onContactSelected,
  navigateToAddressBook,
  onlyBtc = false
}: AddressBookListsProps) {
  const { theme } = useApplicationContext()
  const contacts = useSelector(selectContacts)
  const recentContacts = useSelector(selectRecentContacts)
  const accounts = useSelector(selectAccounts)
  const activeNetwork = useSelector(selectActiveNetwork)

  const addressBookContacts = useMemo(
    () =>
      Object.values(contacts).filter(
        value => (onlyBtc && value.addressBtc) || !onlyBtc
      ),
    [contacts, onlyBtc]
  )

  const recentAddresses = useMemo(
    () =>
      recentContacts
        .map(contact => {
          switch (contact.type) {
            case 'account':
              return {
                item: accounts[contact.id as AccountId],
                type: contact.type
              }
            case 'contact':
              return {
                item: contacts[contact.id],
                type: contact.type
              }
          }
        })
        .filter(
          value =>
            (onlyBtc && value.type === 'contact' && value.item.addressBtc) ||
            (onlyBtc && value.type === 'account') ||
            !onlyBtc
        ),
    [recentContacts, accounts, contacts, onlyBtc]
  )

  const renderCustomLabel = (title: string, selected: boolean) => {
    return selected ? (
      <AvaText.ButtonMedium
        ellipsizeMode={'tail'}
        textStyle={{
          color: theme.alternateBackground
        }}>
        {title}
      </AvaText.ButtonMedium>
    ) : (
      <AvaText.Body2 ellipsizeMode={'tail'} textStyle={{ lineHeight: 24 }}>
        {title}
      </AvaText.Body2>
    )
  }

  return (
    <TabViewAva renderCustomLabel={renderCustomLabel}>
      <TabViewAva.Item title={'Recents'}>
        <FlatList
          data={recentAddresses}
          renderItem={info =>
            renderItem(activeNetwork, info.item, (item, type) =>
              onContactSelected(item, type, 'recents')
            )
          }
          keyExtractor={item => item.item.title + item.item.address}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={{ marginVertical: 40 }}>
              <ZeroState.NoRecentAccounts />
            </View>
          }
        />
      </TabViewAva.Item>
      <TabViewAva.Item title={'Address Book'}>
        <FlatList
          data={addressBookContacts}
          renderItem={info =>
            renderItem(
              activeNetwork,
              { item: info.item, type: 'contact' },
              (item, type) => onContactSelected(item, type, 'addressBook')
            )
          }
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View style={{ marginVertical: 40 }}>
              <ZeroState.EmptyAddressBook
                onGoToAddressBook={navigateToAddressBook}
              />
            </View>
          }
        />
      </TabViewAva.Item>
      <TabViewAva.Item title={'My Accounts'}>
        <FlatList
          data={[...Object.values(accounts)]}
          renderItem={info =>
            renderItem(
              activeNetwork,
              { item: info.item, type: 'account' },
              (item, type) => onContactSelected(item, type, 'accounts')
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={<ZeroState.NoResultsTextual />}
        />
      </TabViewAva.Item>
    </TabViewAva>
  )
}

const renderItem = (
  activeNetwork: Network,
  item: { item: Contact | Account; type: AddrBookItemType },
  onPress: (item: Contact | Account, type: AddrBookItemType) => void
) => {
  return (
    <AddressBookItem
      title={item.item.title}
      address={
        activeNetwork.vmName !== NetworkVMType.BITCOIN
          ? item.item.address
          : undefined
      }
      addressBtc={
        activeNetwork.vmName === NetworkVMType.BITCOIN
          ? item.item.addressBtc
          : undefined
      }
      onPress={() => {
        onPress(item.item, item.type)
      }}
    />
  )
}
