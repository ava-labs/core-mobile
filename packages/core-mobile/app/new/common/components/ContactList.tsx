import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  Avatar,
  Icons,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { loadAvatar } from 'common/utils/loadAvatar'
import { getAddressFromContact } from 'features/accountSettings/utils/getAddressFromContact'
import React, { useCallback, useMemo, useState } from 'react'
import { Contact } from 'store/addressBook'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { ListScreen } from './ListScreen'

export const ContactList = ({
  contacts,
  title,
  ListHeader,
  onPress,
  ListEmptyComponent,
  renderHeaderRight
}: {
  contacts: Contact[]
  title: string
  ListHeader?: React.JSX.Element
  onPress: (contact: Contact) => void
  ListEmptyComponent?: React.JSX.Element
  renderHeaderRight?: () => React.JSX.Element
}): React.JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
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
        contact.addressBTC?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [contacts, searchText])

  const renderItem = useCallback(
    (item: Contact, index: number): React.JSX.Element => {
      const address = getAddressFromContact(item)
      const { name } = item
      const isLastItem = index === searchResults.length - 1
      const avatar = loadAvatar(item.avatar)

      return (
        <View>
          <TouchableOpacity
            sx={{
              marginTop: 12,
              marginHorizontal: 16,
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row'
            }}
            onPress={() => onPress(item)}>
            <View
              sx={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }}>
              <View
                sx={{
                  width: 40,
                  height: 40
                }}>
                <Avatar
                  backgroundColor="transparent"
                  size={40}
                  source={avatar?.source}
                  hasLoading={false}
                />
              </View>
              <View
                sx={{
                  flexGrow: 1,
                  marginHorizontal: 12,
                  flexDirection: 'row'
                }}>
                <View
                  sx={{
                    justifyItems: 'center',
                    justifyContent: 'center'
                  }}>
                  <Text
                    variant="buttonMedium"
                    numberOfLines={1}
                    sx={{ flex: 1 }}>
                    {name}
                  </Text>
                  {address && (
                    <Text
                      variant="body2"
                      sx={{
                        lineHeight: 16,
                        fontSize: 13,
                        color: '$textSecondary'
                      }}
                      ellipsizeMode="tail"
                      numberOfLines={1}>
                      {truncateAddress(address, TRUNCATE_ADDRESS_LENGTH)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <Icons.Navigation.ChevronRight
              width={20}
              height={20}
              color={colors.$textSecondary}
            />
          </TouchableOpacity>
          {!isLastItem && (
            <View sx={{ marginLeft: 62 }}>
              <Separator />
            </View>
          )}
        </View>
      )
    },
    [colors.$textSecondary, onPress, searchResults.length]
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
