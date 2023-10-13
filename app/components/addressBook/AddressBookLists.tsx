import React, { useMemo } from 'react'
import { FlatList, View } from 'react-native'
import ZeroState from 'components/ZeroState'
import TabViewAva from 'components/TabViewAva'
import AvaText from 'components/AvaText'
import AddressBookItem from 'components/addressBook/AddressBookItem'
import { useSelector } from 'react-redux'
import { Account, selectAccounts } from 'store/account'
import {
  AccountId,
  AddrBookItemType,
  Contact,
  selectContacts,
  selectRecentContacts
} from 'store/addressBook'
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
        .reduce(
          (acc, recentContact) => {
            switch (recentContact.type) {
              case 'account': {
                const account = accounts[recentContact.id as AccountId]
                if (account) {
                  acc.push({
                    item: account,
                    type: recentContact.type
                  })
                }
                break
              }
              case 'contact': {
                const contact = contacts[recentContact.id]
                if (contact) {
                  acc.push({
                    item: contact,
                    type: recentContact.type
                  })
                }
                break
              }
            }

            return acc
          },
          [] as {
            item: Account | Contact
            type: AddrBookItemType
          }[]
        )
        .filter(
          value =>
            (onlyBtc && value.type === 'contact' && value.item.addressBtc) ||
            (onlyBtc && value.type === 'account') ||
            !onlyBtc
        ),
    [recentContacts, accounts, contacts, onlyBtc]
  )

  const renderCustomLabel = (
    title: string,
    selected: boolean,
    color: string
  ) => {
    return selected ? (
      <AvaText.ButtonMedium
        ellipsizeMode={'tail'}
        textStyle={{
          color
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
