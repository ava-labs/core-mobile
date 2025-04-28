import {
  Chip,
  Icons,
  Image,
  SimpleDropdown,
  TouchableOpacity,
  useTheme,
  View
} from '@avalabs/k2-alpine'
import { ContactList } from 'common/components/ContactList'
import { ErrorState } from 'common/components/ErrorState'
import { useRouter } from 'expo-router'
import { useSortedContacts } from 'features/accountSettings/hooks/useSortedContacts'
import React, { useCallback } from 'react'
import { uuid } from 'utils/uuid'
import EMPTY_ADDRESS_BOOK_ICON from '../../../../assets/icons/address_book_empty.png'

export const AddressBookScreen = (): JSX.Element => {
  const {
    theme: { colors }
  } = useTheme()
  const { data: contacts, sort } = useSortedContacts()

  const { navigate } = useRouter()

  const goToAddContact = useCallback((): void => {
    navigate({
      pathname: '/accountSettings/addressBook/addContact',
      params: { contactId: uuid() }
    })
  }, [navigate])

  const goToContactDetail = useCallback(
    (contactId: string): void => {
      navigate({
        pathname: '/accountSettings/addressBook/contactDetail',
        params: { contactId }
      })
    },
    [navigate]
  )

  const renderHeaderRight = useCallback(() => {
    return (
      <TouchableOpacity
        onPress={goToAddContact}
        sx={{
          flexDirection: 'row',
          gap: 16,
          marginRight: 18,
          alignItems: 'center'
        }}>
        <Icons.Content.Add
          testID="add_contact_btn"
          width={25}
          height={25}
          color={colors.$textPrimary}
        />
      </TouchableOpacity>
    )
  }, [colors.$textPrimary, goToAddContact])

  const renderListHeader = useCallback(() => {
    return contacts.length > 0 ? (
      <View>
        <SimpleDropdown
          from={
            <Chip size="large" hitSlop={8} rightIcon={'expandMore'}>
              {sort.title}
            </Chip>
          }
          sections={sort.data}
          selectedRows={[sort.selected]}
          onSelectRow={sort.onSelected}
        />
      </View>
    ) : undefined
  }, [contacts.length, sort.data, sort.onSelected, sort.selected, sort.title])

  return (
    <ContactList
      title="Contacts"
      contacts={contacts}
      onPress={contact => goToContactDetail(contact.id)}
      renderHeaderRight={renderHeaderRight}
      ListEmptyComponent={
        <ErrorState
          sx={{ flex: 1 }}
          icon={
            <Image
              source={EMPTY_ADDRESS_BOOK_ICON}
              sx={{ width: 42, height: 42 }}
            />
          }
          title="No saved addresses"
          description="Save addresses for quick access in future transactions"
          button={{
            title: 'Add an address',
            onPress: goToAddContact
          }}
        />
      }
      ListHeader={renderListHeader()}
    />
  )
}
