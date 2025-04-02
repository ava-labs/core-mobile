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
  selectContacts,
  selectRecentContacts
} from 'store/addressBook'
import { Network, NetworkVMType } from '@avalabs/core-chains-sdk'
import { useNetworks } from 'hooks/networks/useNetworks'
import { Contact } from '@avalabs/types'
import {
  getAddressProperty,
  getAddressXP
} from 'store/utils/account&contactGetters'

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
}: AddressBookListsProps): JSX.Element {
  const { activeNetwork } = useNetworks()
  const contacts = useSelector(selectContacts)
  const recentContacts = useSelector(selectRecentContacts)
  const accounts = useSelector(selectAccounts)

  const addressBookContacts = useMemo(
    () =>
      Object.values(contacts).filter(
        value => (onlyBtc && value.addressBTC) || !onlyBtc
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
            (onlyBtc && value.type === 'contact' && value.item.addressBTC) ||
            (onlyBtc && value.type === 'account') ||
            !onlyBtc
        ),
    [recentContacts, accounts, contacts, onlyBtc]
  )

  const renderLabel = (
    title: string,
    selected: boolean,
    color: string
  ): JSX.Element => {
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
    <TabViewAva renderLabel={renderLabel}>
      <TabViewAva.Item title={'Recents'}>
        <FlatList
          data={recentAddresses}
          renderItem={info =>
            renderItem(activeNetwork, info.item, (item, type) =>
              onContactSelected(item, type, 'recents')
            )
          }
          keyExtractor={item => item.item.name + getAddressProperty(item.item)}
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
): JSX.Element => {
  let address
  let addressBtc
  switch (activeNetwork.vmName) {
    case NetworkVMType.BITCOIN:
      addressBtc = item.item.addressBTC
      break
    case NetworkVMType.PVM:
    case NetworkVMType.AVM:
      address = getAddressXP(item.item)
      break
    default:
      address = getAddressProperty(item.item)
  }
  return (
    <AddressBookItem
      title={item.item.name}
      address={address}
      addressBtc={addressBtc}
      onPress={() => {
        onPress(item.item, item.type)
      }}
    />
  )
}
