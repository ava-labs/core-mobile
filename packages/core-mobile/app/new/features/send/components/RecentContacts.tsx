import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  Avatar,
  Icons,
  Image,
  SPRING_LINEAR_TRANSITION,
  SearchBar,
  Separator,
  Text,
  TouchableOpacity,
  View,
  showAlert,
  useTheme
} from '@avalabs/k2-alpine'
import { ErrorState } from 'common/components/ErrorState'
import { FlatListScreenTemplate } from 'common/components/FlatListScreenTemplate'
import { getListItemEnteringAnimation } from 'common/utils/animations'
import { loadAvatar } from 'common/utils/loadAvatar'
import { getAddressFromContact } from 'features/accountSettings/utils/getAddressFromContact'
import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'
import { portfolioTabContentHeight } from 'features/portfolio/utils'
import React, { useCallback, useMemo, useState } from 'react'
import Animated from 'react-native-reanimated'
import { useSelector } from 'react-redux'
import { Contact } from 'store/addressBook'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import EMPTY_ADDRESS_BOOK_ICON from '../../../assets/icons/address_book_empty.png'

const TITLE = `First, enter the\nrecipient's address`

interface Props {
  recentAddresses: Contact[]
  contacts: Contact[]
  onSelectContact: (contact: Contact) => void
  onSubmitEditing: (text: string) => void
  onGoToQrCode: () => void
}

export const RecentContacts = ({
  recentAddresses,
  contacts,
  onSelectContact,
  onSubmitEditing,
  onGoToQrCode
}: Props): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const isDeveloperMode = useSelector(selectIsDeveloperMode)
  const [searchText, setSearchText] = useState('')

  const searchResults = useMemo(() => {
    if (searchText.trim() === '') {
      return recentAddresses
    }
    return contacts.filter(
      contact =>
        contact.name.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.address?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressXP?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.addressBTC?.toLowerCase().includes(searchText.toLowerCase())
    )
  }, [contacts, recentAddresses, searchText])

  const handleSumbitEditing = useCallback(
    (text: string): void => {
      const isValid = isValidAddress({
        address: text,
        isDeveloperMode
      })
      if (isValid === false) {
        showAlert({
          title: 'Invalid address',
          description: 'Please enter a valid address',
          buttons: [
            {
              text: 'Dismiss',
              style: 'cancel'
            }
          ]
        })
        return
      }
      onSubmitEditing(text)
    },
    [isDeveloperMode, onSubmitEditing]
  )

  const renderItem = useCallback(
    (item: Contact, index: number): React.JSX.Element => {
      const address = getAddressFromContact(item)
      const { name } = item
      const isLastItem = index === searchResults.length - 1

      const avatar = loadAvatar(item.avatar)

      return (
        <Animated.View
          entering={getListItemEnteringAnimation(index)}
          layout={SPRING_LINEAR_TRANSITION}>
          <TouchableOpacity
            sx={{
              marginTop: 12,
              marginHorizontal: 16,
              justifyContent: 'space-between',
              alignItems: 'center',
              flexDirection: 'row'
            }}
            onPress={() => onSelectContact(item)}>
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
                      {truncateAddress(address)}
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
        </Animated.View>
      )
    },
    [colors.$textSecondary, searchResults.length, onSelectContact]
  )

  const renderHeader = useCallback(() => {
    return (
      <View
        style={{
          gap: 16
        }}>
        <SearchBar
          onTextChanged={setSearchText}
          searchText={searchText}
          placeholder="Type in address or search contact"
          useDebounce={true}
          onSubmitEditing={e => handleSumbitEditing(e.nativeEvent.text)}
          rightComponent={
            <TouchableOpacity
              onPress={onGoToQrCode}
              hitSlop={16}
              sx={{
                marginRight: 9,
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <Icons.Custom.QRCodeScanner
                color={colors.$textSecondary}
                width={20}
                height={20}
              />
            </TouchableOpacity>
          }
        />
        <Text variant="heading6" sx={{ color: '$textPrimary' }}>
          {searchText.trim().length > 0 ? 'Contacts' : 'Recents'}
        </Text>
      </View>
    )
  }, [colors.$textSecondary, handleSumbitEditing, onGoToQrCode, searchText])

  return (
    <FlatListScreenTemplate
      title={TITLE}
      data={searchResults}
      renderHeader={renderHeader}
      keyExtractor={item => `recent-contact-${item.id}`}
      renderItem={item => renderItem(item.item as Contact, item.index)}
      ListEmptyComponent={
        <ErrorState
          sx={{ flex: 1 }}
          icon={
            <Image
              source={EMPTY_ADDRESS_BOOK_ICON}
              sx={{ width: 42, height: 42 }}
            />
          }
          title="No recent addresses"
          description="Search address or scan QR code to send funds"
        />
      }
    />
  )
}
