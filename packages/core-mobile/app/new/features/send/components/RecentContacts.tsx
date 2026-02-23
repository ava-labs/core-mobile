import { truncateAddress } from '@avalabs/core-utils-sdk'
import {
  Icons,
  Image,
  SearchBar,
  Text,
  TouchableOpacity,
  View,
  showAlert,
  useTheme
} from '@avalabs/k2-alpine'
import { NetworkVMType } from '@avalabs/vm-module-types'

import { ErrorState } from 'common/components/ErrorState'
import { ListScreen } from 'common/components/ListScreen'
import { ListViewItem } from 'common/components/ListViewItem'
import { WalletIcon } from 'common/components/WalletIcon'
import { TRUNCATE_ADDRESS_LENGTH } from 'common/consts/text'
import { loadAvatar } from 'common/utils/loadAvatar'
import { useGlobalSearchParams } from 'expo-router'
import { isValidAddress } from 'features/accountSettings/utils/isValidAddress'
import React, { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { WalletType } from 'services/wallet/types'
import { selectAccountById } from 'store/account'
import { Contact } from 'store/addressBook'
import { selectIsDeveloperMode } from 'store/settings/advanced'
import { selectWalletById, selectWallets } from 'store/wallet/slice'
import EMPTY_ADDRESS_BOOK_ICON from '../../../assets/icons/address_book_empty.png'
import { filterContactsBySearchText } from '../utils/filterContactsBySearchText'
import { getMatchingAddress } from '../utils/getMatchingAddress'

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
  const { vmName } = useGlobalSearchParams<{ vmName: NetworkVMType }>()

  const searchResults = useMemo(() => {
    if (searchText.trim().length === 0) {
      return recentAddresses
    }
    return filterContactsBySearchText(contacts, searchText)
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
              text: 'Dismiss'
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
      const address = getMatchingAddress({
        contact: item,
        searchText,
        vmName,
        isDeveloperMode
      })
      const isLast = index === searchResults.length - 1

      return (
        <ContactListItem
          item={item}
          address={address ?? ''}
          isLast={isLast}
          onSelectContact={onSelectContact}
        />
      )
    },
    [searchText, vmName, isDeveloperMode, searchResults.length, onSelectContact]
  )

  const renderHeader = useCallback(() => {
    return (
      <View
        style={{
          gap: 16
        }}>
        <SearchBar
          testID="search_bar"
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
                paddingHorizontal: 12,
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

  const renderEmpty = useCallback(() => {
    return (
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
    )
  }, [])

  return (
    <ListScreen
      title={`First, enter the\nrecipient's address`}
      navigationTitle="Enter the recipient's address"
      data={searchResults}
      isModal
      renderHeader={renderHeader}
      keyExtractor={item => `recent-contact-${item.id}`}
      renderItem={item => renderItem(item.item as Contact, item.index)}
      renderEmpty={renderEmpty}
    />
  )
}

const ContactListItem = ({
  item,
  address,
  isLast,
  onSelectContact
}: {
  item: Contact
  address: string
  isLast: boolean
  onSelectContact: (contact: Contact) => void
}): JSX.Element => {
  const { theme } = useTheme()
  const avatar = loadAvatar(item.avatar)
  const account = useSelector(selectAccountById(item.id))
  const wallet = useSelector(selectWalletById(account?.walletId ?? ''))
  const wallets = useSelector(selectWallets)
  const walletsCount = Object.keys(wallets).length

  return (
    <ListViewItem
      avatar={avatar}
      title={item.name}
      renderTop={() =>
        wallet &&
        walletsCount > 1 && (
          <View sx={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <WalletIcon
              width={16}
              height={16}
              wallet={wallet}
              color={theme.colors.$textSecondary}
              isExpanded
            />
            <Text
              variant="buttonSmall"
              sx={{
                color: '$textSecondary',
                lineHeight: 16
              }}>
              {wallet?.type === WalletType.PRIVATE_KEY
                ? 'Imported'
                : wallet?.name}
            </Text>
          </View>
        )
      }
      subtitle={
        address ? truncateAddress(address, TRUNCATE_ADDRESS_LENGTH) : undefined
      }
      titleProps={{
        testID: `recent_contacts__${item.name}`,
        accessibilityLabel: `recent_contacts__${item.name}`
      }}
      subtitleProps={{
        variant: 'mono'
      }}
      isLast={isLast}
      onPress={() => onSelectContact(item)}
      showArrow
    />
  )
}
