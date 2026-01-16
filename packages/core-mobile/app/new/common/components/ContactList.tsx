import { truncateAddress } from '@avalabs/core-utils-sdk'
import { SearchBar, View } from '@avalabs/k2-alpine'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { loadAvatar } from 'common/utils/loadAvatar'
import { getAddressFromContact } from 'features/accountSettings/utils/getAddressFromContact'
import React, { useCallback, useMemo, useState } from 'react'
import { Contact } from 'store/addressBook'
import { ListScreen } from './ListScreen'
import { ListViewItem } from './ListViewItem'

export const ContactList = ({
  contacts,
  title,
  ListHeader,
  ListEmptyComponent,
  onPress,
  renderHeaderRight
}: {
  contacts: Contact[]
  title: string
  ListHeader?: React.JSX.Element
  onPress: (contact: Contact) => void
  ListEmptyComponent?: React.JSX.Element
  renderHeaderRight?: () => React.JSX.Element
}): React.JSX.Element => {
  const [searchText, setSearchText] = useState('')

  const searchResults = useMemo(() => {
    if (searchText === '' || contacts.length === 0) {
      return contacts
    }
    return contacts.filter(
      contact =>
        contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressXP?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressBTC?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressSVM?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [contacts, searchText])

  const renderItem = useCallback(
    (item: Contact, index: number): React.JSX.Element => {
      const address = getAddressFromContact(item)
      const { name } = item
      const isLastItem = index === searchResults.length - 1
      const avatar = loadAvatar(item.avatar)

      return (
        <ListViewItem
          avatar={avatar}
          title={name}
          subtitle={
            address
              ? truncateAddress(address, TRUNCATE_ADDRESS_LENGTH)
              : undefined
          }
          titleProps={{
            testID: `contact_preview_address`,
            accessibilityLabel: `contact_preview_address`
          }}
          subtitleProps={{
            variant: 'mono'
          }}
          isLast={isLastItem}
          onPress={() => onPress(item)}
          showArrow
        />
      )
    },
    [onPress, searchResults.length]
  )

  const renderHeader = useCallback(() => {
    return (
      <View sx={{ gap: 16 }}>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Search addresses"
          useDebounce={true}
        />
        {ListHeader}
      </View>
    )
  }, [ListHeader, searchText, setSearchText])

  const renderEmpty = useCallback(() => {
    return ListEmptyComponent
  }, [ListEmptyComponent])

  return (
    <ListScreen
      title={title}
      keyExtractor={item => (item as Contact).id}
      data={searchResults}
      isModal
      hasParent
      renderItem={item => renderItem(item.item as Contact, item.index)}
      renderHeader={renderHeader}
      renderHeaderRight={renderHeaderRight}
      renderEmpty={renderEmpty}
    />
  )
}
