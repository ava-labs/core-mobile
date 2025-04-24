import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  Avatar,
  FlatList,
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
import { useSimpleFadingHeader } from 'new/common/hooks/useSimpleFadingHeader'
import EMPTY_ADDRESS_BOOK_ICON from '../../../assets/icons/address_book_empty.png'

const TITLE = `First, enter the\nrecipient’s address`

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
  const { onScroll, handleHeaderLayout, animatedHeaderStyle } =
    useSimpleFadingHeader({
      title: 'Recipient’s address',
      shouldHeaderHaveGrabber: true
    })
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
          key={item.id}
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

  return (
    <FlatList
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      data={searchResults}
      contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
      keyExtractor={item => (item as Contact).id}
      ListEmptyComponent={
        <ErrorState
          sx={{ height: portfolioTabContentHeight }}
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
      ListHeaderComponent={
        <View sx={{ gap: 16, marginHorizontal: 16 }}>
          <Animated.View
            style={animatedHeaderStyle}
            onLayout={handleHeaderLayout}>
            <Text variant="heading2">{TITLE}</Text>
          </Animated.View>
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
      }
      renderItem={item => renderItem(item.item as Contact, item.index)}
    />
  )
}
